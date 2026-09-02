'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SelectableCard } from '@/components/wizard/SelectableCard';
import { StepShell } from '@/components/wizard/StepShell';
import YandexAddressMap from '@/components/YandexAddressMap';
import { submitOrder } from '@/app/actions/orders';
import { useCart } from '@/lib/cart-context';
import {
  ALL_PRODUCT_CATEGORIES,
  AUTO_PUMP_SKUS,
  MORTAR_KIND_LABELS,
  PRODUCT_CATEGORY_HINTS,
  PRODUCT_CATEGORY_LABELS,
  PUMP_TYPE_LABELS,
  STATIONARY_PUMP_SKUS,
  categoryUsesAggregate,
  categoryUsesConcreteSpecs,
  categoryUsesMortarKind,
  categoryUsesPump,
  categoryUsesQuantity,
  describeCartItem,
  describeCartItemQuantity,
  emptyCartItem,
  formatPrice,
  getCartTotal,
  getGradeOptions,
  getItemLineTotal,
  getItemUnitPrice,
  getSkuSpecs,
  isCartItemValid,
  itemRequiresGrade,
  type CartItem,
} from '@/lib/catalog';
import type { ConcreteAggregate, MortarKind, ProductCategory, PumpType } from '@prisma/client';

const CONCRETE_AGGREGATES: { value: ConcreteAggregate; label: string }[] = [
  { value: 'GRAVEL', label: 'На гравии' },
  { value: 'GRANITE', label: 'На граните' },
  { value: 'EXPANDED_CLAY', label: 'Керамзитобетон' },
];

const MORTAR_KINDS: MortarKind[] = ['CEMENT', 'SAND_CONCRETE', 'SPECIAL'];
const PUMP_TYPES: PumpType[] = ['AUTO', 'STATIONARY'];

const TIME_SLOTS = [
  '08:00–10:00',
  '10:00–12:00',
  '12:00–14:00',
  '14:00–16:00',
  '16:00–18:00',
  '18:00–20:00',
];

// Шаги мастера. "catalog" — выбор категории и заполнение позиции, "cart" —
// обзор корзины (можно добавить ещё позицию или перейти дальше). Корзина
// общая с публичными страницами каталога (app/catalog, lib/cart-context.tsx) —
// можно набрать позиции там, а сюда прийти сразу к их оформлению, или наоборот.
type Step = 'catalog' | 'cart' | 'address' | 'datetime' | 'contact' | 'summary';

const STEPS: Step[] = ['catalog', 'cart', 'address', 'datetime', 'contact', 'summary'];

type OrderDetailsState = {
  addressText: string;
  latitude: number;
  longitude: number;
  addressResolved: boolean;
  dateOption: 'today' | 'tomorrow' | 'custom';
  customDate: string;
  timeSlot: string;
  contactName: string;
  contactPhone: string;
  comment: string;
  guestEmail: string;
  guestPassword: string;
};

const MOSCOW_CENTER = {
  lat: 55.7558,
  lng: 37.6176,
};

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Для доставки «сегодня» скрываем слоты, которые уже прошли (или начинаются
 * меньше чем через час — заводу нужно время подготовиться и выехать). */
function availableTimeSlotsFor(dateOption: OrderDetailsState['dateOption']): string[] {
  if (dateOption !== 'today') return TIME_SLOTS;
  const now = new Date();
  const minMinutes = now.getHours() * 60 + now.getMinutes() + 60;
  return TIME_SLOTS.filter((slot) => {
    const [from] = slot.split('–');
    const [h, m] = from.split(':').map(Number);
    return h * 60 + m > minMinutes;
  });
}

export function OrderWizard({
  isAuthenticated,
  prefillName,
  prefillPhone,
}: {
  isAuthenticated: boolean;
  prefillName: string;
  prefillPhone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ orderNumber: string } | null>(null);

  // Корзина общая со страницами каталога (app/catalog) — хранится в
  // lib/cart-context.tsx (localStorage), а не только в состоянии этого
  // компонента, поэтому позиции, добавленные на витрине каталога, уже видны
  // здесь.
  const { items: cart, addItem, removeItem, clearCart } = useCart();
  // Позиция, которая сейчас заполняется на шаге "catalog" (ещё не в корзине).
  const [draft, setDraft] = useState<CartItem | null>(null);

  const [details, setDetails] = useState<OrderDetailsState>({
    addressText: '',
    latitude: MOSCOW_CENTER.lat,
    longitude: MOSCOW_CENTER.lng,
    addressResolved: false,

    dateOption: 'today',
    customDate: todayISO(),
    timeSlot: '',

    contactName: prefillName,
    contactPhone: prefillPhone,
    comment: '',

    guestEmail: '',
    guestPassword: '',
  });

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  // Если в корзину уже что-то добавлено (например, на страницах каталога до
  // перехода сюда), сразу открываем обзор корзины, а не пустой выбор
  // категории. Корзина подгружается из localStorage асинхронно (после
  // монтирования), поэтому это отдельный эффект, а не начальное значение
  // useState — и срабатывает только один раз, чтобы не перекидывать
  // пользователя обратно в корзину, если он сам ушёл добавлять ещё позицию.
  const [autoJumped, setAutoJumped] = useState(false);
  useEffect(() => {
    if (!autoJumped && cart.length > 0 && stepIdx === 0) {
      setStepIdx(STEPS.indexOf('cart'));
      setAutoJumped(true);
    }
  }, [cart.length, autoJumped, stepIdx]);

  const availableTimeSlots = useMemo(() => availableTimeSlotsFor(details.dateOption), [details.dateOption]);
  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);

  function updateDetails<K extends keyof OrderDetailsState>(key: K, value: OrderDetailsState[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function updateDraft<K extends keyof CartItem>(key: K, value: CartItem[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function selectCategory(category: ProductCategory) {
    setError(null);
    setDraft(emptyCartItem(category));
  }

  function addDraftToCart() {
    if (!draft) return;
    if (!isCartItemValid(draft)) {
      setError('Заполните обязательные поля позиции');
      return;
    }
    // Класс/морозостойкость/водонепроницаемость подтягиваются автоматически
    // по выбранной марке (см. lib/catalog.ts -> getSkuSpecs) — записываем их
    // в позицию здесь же, чтобы они сохранились в заказе вместе с остальным,
    // а не только отображались в форме на время выбора.
    const specs = getSkuSpecs(draft);
    const finalItem: CartItem = specs
      ? {
          ...draft,
          concreteClass: specs.classLabel ?? draft.concreteClass,
          frostResistance: specs.frost ?? draft.frostResistance,
          waterResistance: specs.water ?? draft.waterResistance,
        }
      : draft;
    addItem(finalItem);
    setDraft(null);
    setError(null);
    setStepIdx(STEPS.indexOf('cart'));
  }

  /** Смена даты доставки — заодно сбрасываем ранее выбранный слот времени. */
  function selectDateOption(option: OrderDetailsState['dateOption']) {
    setDetails((current) => ({ ...current, dateOption: option, timeSlot: '' }));
  }

  function goToStep(target: Step) {
    setError(null);
    setStepIdx(STEPS.indexOf(target));
  }

  function next() {
    setError(null);

    if (step === 'catalog') {
      // Если позиция уже заполняется — "Продолжить" добавляет её в корзину.
      if (draft) return addDraftToCart();
      if (cart.length === 0) return setError('Добавьте хотя бы одну позицию в корзину');
      return goToStep('cart');
    }

    if (step === 'cart' && cart.length === 0) {
      return setError('Корзина пуста — добавьте хотя бы одну позицию');
    }

    if (step === 'address' && details.addressText.trim().length < 3) {
      return setError('Укажите адрес доставки');
    }

    // Текст адреса есть, но координаты ему могут не соответствовать — см.
    // объяснение в исходном комментарии этого мастера про addressResolved.
    if (step === 'address' && !details.addressResolved) {
      return setError(
        'Нажмите «Найти» рядом с адресом или отметьте точку на карте, чтобы подтвердить местоположение',
      );
    }

    if (step === 'datetime' && !details.timeSlot) {
      return setError('Выберите время доставки');
    }

    if (step === 'contact') {
      if (details.contactName.trim().length < 2) return setError('Укажите имя');
      if (details.contactPhone.trim().length < 5) return setError('Укажите телефон');

      if (!isAuthenticated) {
        if (!details.guestEmail || !details.guestEmail.includes('@')) {
          return setError('Укажите корректный email');
        }
        if (!details.guestPassword || details.guestPassword.length < 6) {
          return setError('Пароль должен быть не короче 6 символов');
        }
      }
    }

    setStepIdx((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    if (step === 'catalog' && draft) {
      // Из заполнения позиции возвращаемся к выбору категории, а не к
      // предыдущему шагу мастера.
      setDraft(null);
      return;
    }
    setStepIdx((current) => Math.max(current - 1, 0));
  }

  function groupIndexFor(s: Step) {
    if (s === 'catalog') return 0;
    if (s === 'cart') return 1;
    if (s === 'address' || s === 'datetime') return 2;
    if (s === 'contact') return 3;
    return 4;
  }

  function handleSubmit() {
    setError(null);

    const deliveryDate =
      details.dateOption === 'today' ? todayISO() : details.dateOption === 'tomorrow' ? todayISO(1) : details.customDate;

    const [timeFrom, timeTo] = details.timeSlot.split('–');

    startTransition(async () => {
      const result = await submitOrder({
        items: cart.map((item) => ({
          category: item.category,
          concreteGrade: itemRequiresGrade(item) ? item.concreteGrade ?? undefined : undefined,
          aggregate: categoryUsesAggregate(item.category) ? item.aggregate ?? undefined : undefined,
          concreteClass: categoryUsesConcreteSpecs(item.category) ? item.concreteClass || undefined : undefined,
          mobility: categoryUsesConcreteSpecs(item.category) ? item.mobility || undefined : undefined,
          frostResistance: categoryUsesConcreteSpecs(item.category) ? item.frostResistance || undefined : undefined,
          waterResistance: categoryUsesConcreteSpecs(item.category) ? item.waterResistance || undefined : undefined,
          hasFiber: categoryUsesConcreteSpecs(item.category) ? item.hasFiber : undefined,
          mortarKind: categoryUsesMortarKind(item.category) ? item.mortarKind ?? undefined : undefined,
          pumpType: categoryUsesPump(item.category) ? item.pumpType ?? undefined : undefined,
          pumpLength: categoryUsesPump(item.category) ? item.pumpLength || undefined : undefined,
          pumpNote: categoryUsesPump(item.category) ? item.pumpNote || undefined : undefined,
          quantity: categoryUsesQuantity(item.category) ? item.quantity : 0,
          additionalWishes: item.additionalWishes || undefined,
        })),

        addressText: details.addressText,
        latitude: details.latitude,
        longitude: details.longitude,

        deliveryDate,
        deliveryTimeFrom: timeFrom,
        deliveryTimeTo: timeTo,

        contactName: details.contactName,
        contactPhone: details.contactPhone,
        comment: details.comment || undefined,

        guestEmail: isAuthenticated ? undefined : details.guestEmail,
        guestPassword: isAuthenticated ? undefined : details.guestPassword,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      clearCart();
      setSubmitted({ orderNumber: result.orderNumber });
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-navy-800">Заказ {submitted.orderNumber} создан</h1>
        <p className="mt-2 text-navy-500">
          Мы отправили заявку подходящим заводам. Как только один из заводов подтвердит заказ, вы увидите
          информацию в разделе «Мои заказы».
        </p>
        <button className="btn-primary mt-6" onClick={() => router.push('/client/orders')}>
          Перейти к моим заказам
        </button>
      </div>
    );
  }

  const footer = (
    <div className="flex gap-3">
      {step !== 'summary' && (
        <button type="button" onClick={next} className="btn-primary w-full">
          {step === 'catalog' && draft ? 'Добавить в корзину' : 'Продолжить'}
        </button>
      )}
      {step === 'summary' && (
        <button type="button" onClick={handleSubmit} disabled={isPending} className="btn-primary w-full">
          {isPending ? 'Оформляем…' : 'Подтвердить заказ'}
        </button>
      )}
    </div>
  );

  const draftGradeOptions = draft ? getGradeOptions(draft) : [];
  const draftUnitPrice = draft ? getItemUnitPrice(draft) : null;
  const draftLineTotal = draft ? getItemLineTotal(draft) : null;
  const draftSpecs = draft ? getSkuSpecs(draft) : null;

  return (
    <StepShell
      title={stepTitle(step, !!draft)}
      subtitle={stepSubtitle(step, !!draft)}
      groupIndex={groupIndexFor(step)}
      onBack={stepIdx > 0 || draft ? back : undefined}
      footer={footer}
    >
      {error && <p className="field-error mb-4">{error}</p>}

      {step === 'catalog' && !draft && (
        <div className="space-y-3">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => goToStep('cart')}
              className="mb-2 w-full rounded-xl border border-dashed border-surface-border p-3 text-left text-sm text-navy-600 hover:border-navy-400"
            >
              В корзине уже {cart.length}{' '}
              {cart.length === 1 ? 'позиция' : cart.length < 5 ? 'позиции' : 'позиций'} — перейти к корзине →
            </button>
          )}
          {ALL_PRODUCT_CATEGORIES.map((category) => (
            <SelectableCard
              key={category}
              label={PRODUCT_CATEGORY_LABELS[category]}
              sublabel={PRODUCT_CATEGORY_HINTS[category]}
              selected={false}
              onClick={() => selectCategory(category)}
            />
          ))}
        </div>
      )}

      {step === 'catalog' && draft && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-navy-500">{PRODUCT_CATEGORY_LABELS[draft.category]}</p>

          {categoryUsesAggregate(draft.category) && (
            <div>
              <p className="field-label">Наполнитель</p>
              <div className="grid grid-cols-1 gap-3">
                {CONCRETE_AGGREGATES.map(({ value, label }) => (
                  <SelectableCard
                    key={value}
                    label={label}
                    selected={draft.aggregate === value}
                    onClick={() => {
                      updateDraft('aggregate', value);
                      // Марки разные для разных наполнителей (см.
                      // lib/catalog.ts -> BETON_SKUS) — ранее выбранная
                      // марка может не существовать для нового наполнителя.
                      updateDraft('concreteGrade', null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {categoryUsesMortarKind(draft.category) && (
            <div>
              <p className="field-label">Вид раствора</p>
              <div className="grid grid-cols-1 gap-3">
                {MORTAR_KINDS.map((kind) => (
                  <SelectableCard
                    key={kind}
                    label={kind === 'SPECIAL' ? 'Специальные растворы' : MORTAR_KIND_LABELS[kind]}
                    selected={draft.mortarKind === kind}
                    onClick={() => {
                      updateDraft('mortarKind', kind);
                      // Марки у "Цементных" и "Пескобетона" разные наборы, а
                      // у "Специальных" марки нет вообще — сбрасываем.
                      updateDraft('concreteGrade', null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {itemRequiresGrade(draft) && draftGradeOptions.length > 0 && (
            <div>
              <p className="field-label">Марка</p>
              <div className="grid grid-cols-3 gap-3">
                {draftGradeOptions.map((grade) => (
                  <SelectableCard
                    key={grade}
                    label={grade}
                    selected={draft.concreteGrade === grade}
                    onClick={() => updateDraft('concreteGrade', grade)}
                  />
                ))}
              </div>
            </div>
          )}

          {categoryUsesQuantity(draft.category) && (
            <div>
              <label className="field-label">Количество, м³</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateDraft('quantity', Math.max(1, draft.quantity - 1))}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface-border text-2xl text-navy-600 hover:bg-surface-border"
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={draft.quantity}
                  onChange={(event) => updateDraft('quantity', Math.max(1, Number(event.target.value) || 1))}
                  className="field-input text-center text-xl font-semibold"
                />
                <button
                  type="button"
                  onClick={() => updateDraft('quantity', draft.quantity + 1)}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface-border text-2xl text-navy-600 hover:bg-surface-border"
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {categoryUsesConcreteSpecs(draft.category) && (
            <div className="space-y-4 rounded-xl border border-surface-border p-4">
              {draftSpecs ? (
                <div>
                  <p className="text-sm text-navy-400">Характеристики — подтянуты автоматически по выбранной марке.</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {draftSpecs.classLabel && (
                      <>
                        <dt className="text-navy-400">Класс</dt>
                        <dd className="font-medium text-navy-800">{draftSpecs.classLabel}</dd>
                      </>
                    )}
                    {draftSpecs.frost && (
                      <>
                        <dt className="text-navy-400">Морозостойкость</dt>
                        <dd className="font-medium text-navy-800">{draftSpecs.frost}</dd>
                      </>
                    )}
                    {draftSpecs.water && (
                      <>
                        <dt className="text-navy-400">Водонепроницаемость</dt>
                        <dd className="font-medium text-navy-800">{draftSpecs.water}</dd>
                      </>
                    )}
                    {draftSpecs.density != null && (
                      <>
                        <dt className="text-navy-400">Плотность</dt>
                        <dd className="font-medium text-navy-800">{draftSpecs.density} кг/м³</dd>
                      </>
                    )}
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-navy-400">Выберите марку — класс, морозостойкость и водонепроницаемость подтянутся автоматически.</p>
              )}
              <div>
                <label className="field-label">Подвижность (по желанию)</label>
                <input
                  className="field-input"
                  value={draft.mobility}
                  onChange={(event) => updateDraft('mobility', event.target.value)}
                  placeholder="например, П3"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-navy-700">
                <input
                  type="checkbox"
                  checked={draft.hasFiber}
                  onChange={(event) => updateDraft('hasFiber', event.target.checked)}
                  className="h-5 w-5 rounded border-surface-border"
                />
                Нужна фибра
              </label>
            </div>
          )}

          {categoryUsesPump(draft.category) && (
            <div className="space-y-5">
              <div>
                <p className="field-label">Какой насос нужен?</p>
                <div className="grid grid-cols-2 gap-3">
                  {PUMP_TYPES.map((type) => (
                    <SelectableCard
                      key={type}
                      label={PUMP_TYPE_LABELS[type]}
                      selected={draft.pumpType === type}
                      onClick={() => {
                        updateDraft('pumpType', type);
                        updateDraft('pumpLength', '');
                      }}
                    />
                  ))}
                </div>
              </div>

              {draft.pumpType && (
                <div>
                  <p className="field-label">{draft.pumpType === 'AUTO' ? 'Вылет стрелы' : 'Вариант'}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(draft.pumpType === 'AUTO' ? AUTO_PUMP_SKUS : STATIONARY_PUMP_SKUS).map((sku) => (
                      <SelectableCard
                        key={sku.length}
                        label={sku.length}
                        sublabel={formatPrice(sku.price)}
                        selected={draft.pumpLength === sku.length}
                        onClick={() => updateDraft('pumpLength', sku.length)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">Дополнительная информация о насосе</label>
                <textarea
                  className="field-input"
                  rows={2}
                  value={draft.pumpNote}
                  onChange={(event) => updateDraft('pumpNote', event.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Дополнительные пожелания</label>
            <textarea
              className="field-input"
              rows={2}
              value={draft.additionalWishes}
              onChange={(event) => updateDraft('additionalWishes', event.target.value)}
            />
          </div>

          {(draftUnitPrice !== null || draftLineTotal !== null) && (
            <div className="rounded-xl bg-surface-muted p-4 text-sm">
              {categoryUsesQuantity(draft.category) && draftUnitPrice !== null && (
                <p className="text-navy-500">Цена: {formatPrice(draftUnitPrice)} / м³</p>
              )}
              <p className="mt-0.5 font-semibold text-navy-800">Итого по позиции: {formatPrice(draftLineTotal)}</p>
            </div>
          )}
        </div>
      )}

      {step === 'cart' && (
        <div className="space-y-4">
          {cart.length === 0 ? (
            <p className="card text-sm text-navy-400">Корзина пуста.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const lineTotal = getItemLineTotal(item);
                return (
                  <div key={item.key} className="card flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy-800">{describeCartItem(item)}</p>
                      {describeCartItemQuantity(item) && (
                        <p className="mt-0.5 text-sm text-navy-500">{describeCartItemQuantity(item)}</p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-navy-700">{formatPrice(lineTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="shrink-0 text-sm text-navy-400 hover:text-red-600"
                      aria-label="Удалить позицию"
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
              <div className="card flex items-center justify-between bg-surface-muted">
                <span className="font-semibold text-navy-800">Итого</span>
                <span className="text-lg font-bold text-navy-800">{formatPrice(cartTotal)}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => goToStep('catalog')}
            className="btn-secondary w-full"
          >
            + Добавить ещё позицию
          </button>
        </div>
      )}

      {step === 'address' && (
        <div className="space-y-4">
          <YandexAddressMap
            address={details.addressText}
            latitude={details.latitude}
            longitude={details.longitude}
            onAddressChange={(address) => updateDetails('addressText', address)}
            onManualEdit={() => updateDetails('addressResolved', false)}
            onChange={(latitude, longitude) => {
              setDetails((current) => ({ ...current, latitude, longitude, addressResolved: true }));
            }}
          />
        </div>
      )}

      {step === 'datetime' && (
        <div className="space-y-5">
          <div>
            <p className="field-label">Дата доставки</p>
            <div className="grid grid-cols-3 gap-3">
              <SelectableCard
                label="Сегодня"
                selected={details.dateOption === 'today'}
                onClick={() => selectDateOption('today')}
              />
              <SelectableCard
                label="Завтра"
                selected={details.dateOption === 'tomorrow'}
                onClick={() => selectDateOption('tomorrow')}
              />
              <SelectableCard
                label="Выбрать дату"
                selected={details.dateOption === 'custom'}
                onClick={() => selectDateOption('custom')}
              />
            </div>

            {details.dateOption === 'custom' && (
              <input
                type="date"
                className="field-input mt-3"
                min={todayISO()}
                value={details.customDate}
                onChange={(event) => updateDetails('customDate', event.target.value)}
              />
            )}
          </div>

          <div>
            <p className="field-label">Время доставки</p>
            {availableTimeSlots.length === 0 && (
              <p className="mb-3 text-sm text-navy-400">
                На сегодня подходящих слотов уже нет — выберите «Завтра» или другую дату.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {availableTimeSlots.map((time) => (
                <SelectableCard
                  key={time}
                  label={time}
                  selected={details.timeSlot === time}
                  onClick={() => updateDetails('timeSlot', time)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="field-label">Имя</label>
            <input
              className="field-input"
              value={details.contactName}
              onChange={(event) => updateDetails('contactName', event.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Телефон</label>
            <input
              className="field-input"
              type="tel"
              value={details.contactPhone}
              onChange={(event) => updateDetails('contactPhone', event.target.value)}
              placeholder="+7 900 000-00-00"
            />
          </div>

          <div>
            <label className="field-label">Комментарий</label>
            <textarea
              className="field-input"
              rows={2}
              value={details.comment}
              onChange={(event) => updateDetails('comment', event.target.value)}
              placeholder="Например, позвонить за 30 минут до приезда"
            />
          </div>

          {!isAuthenticated && (
            <div className="rounded-xl border border-dashed border-surface-border p-4">
              <p className="mb-3 text-sm text-navy-500">
                Укажите email и пароль, чтобы отслеживать статус заказа в личном кабинете. Если у вас уже есть
                аккаунт БСБ — просто войдите теми же данными.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="field-label">Email</label>
                  <input
                    className="field-input"
                    type="email"
                    value={details.guestEmail}
                    onChange={(event) => updateDetails('guestEmail', event.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Пароль</label>
                  <input
                    className="field-input"
                    type="password"
                    value={details.guestPassword}
                    onChange={(event) => updateDetails('guestPassword', event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'summary' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold text-navy-800">Ваш заказ</h2>

            <div className="space-y-2 border-t border-surface-border pt-2.5 first:border-0 first:pt-0">
              {cart.map((item) => (
                <div key={item.key} className="flex justify-between gap-4">
                  <span className="text-sm text-navy-500">{describeCartItem(item)}</span>
                  <span className="shrink-0 text-right text-sm font-medium text-navy-800">
                    {describeCartItemQuantity(item) ? `${describeCartItemQuantity(item)} · ` : ''}
                    {formatPrice(getItemLineTotal(item))}
                  </span>
                </div>
              ))}
            </div>

            <SummaryRow label="Итого" value={formatPrice(cartTotal)} />
            <SummaryRow label="Адрес" value={details.addressText} />
            <SummaryRow
              label="Дата"
              value={
                details.dateOption === 'today' ? 'Сегодня' : details.dateOption === 'tomorrow' ? 'Завтра' : details.customDate
              }
            />
            <SummaryRow label="Время" value={details.timeSlot} />
            {details.comment && <SummaryRow label="Комментарий" value={details.comment} />}
            <SummaryRow label="Контакт" value={`${details.contactName}, ${details.contactPhone}`} />
          </div>
        </div>
      )}
    </StepShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-surface-border pt-2.5 first:border-0 first:pt-0">
      <span className="text-sm text-navy-400">{label}</span>
      <span className="text-right text-sm font-medium text-navy-800">{value}</span>
    </div>
  );
}

function stepTitle(step: Step, hasDraft: boolean) {
  switch (step) {
    case 'catalog':
      return hasDraft ? 'Параметры позиции' : 'Что нужно?';
    case 'cart':
      return 'Корзина';
    case 'address':
      return 'Куда доставить?';
    case 'datetime':
      return 'Когда доставить?';
    case 'contact':
      return 'Контактные данные';
    case 'summary':
      return 'Проверьте заказ';
    default:
      return '';
  }
}

function stepSubtitle(step: Step, hasDraft: boolean) {
  switch (step) {
    case 'catalog':
      return hasDraft ? undefined : 'Выберите категорию товара из каталога';
    case 'cart':
      return 'Можно добавить ещё позиции или перейти к оформлению';
    case 'contact':
      return 'Мы свяжемся с вами по указанному телефону';
    default:
      return undefined;
  }
}
