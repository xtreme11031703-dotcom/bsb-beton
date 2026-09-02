'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SelectableCard } from '@/components/wizard/SelectableCard';
import { StepShell } from '@/components/wizard/StepShell';
import YandexAddressMap from '@/components/YandexAddressMap';
import { submitOrder } from '@/app/actions/orders';
import { MATERIAL_LABELS, PUMP_TYPE_LABELS } from '@/lib/utils';

type MaterialType =
  | 'CONCRETE'
  | 'SAND'
  | 'GRAVEL'
  | 'CEMENT'
  | 'MORTAR'
  | 'OTHER';

type ConcreteGrade =
  | 'M100'
  | 'M150'
  | 'M200'
  | 'M250'
  | 'M300'
  | 'M350'
  | 'M400'
  | 'M450'
  | 'M500';

type PumpType = 'AUTO' | 'STATIONARY';

const CONCRETE_GRADES: ConcreteGrade[] = [
  'M100',
  'M150',
  'M200',
  'M250',
  'M300',
  'M350',
  'M400',
  'M450',
  'M500',
];

const AUTO_PUMP_LENGTHS = [
  '24 м',
  '28 м',
  '32 м',
  '36 м',
  '40 м',
  '42 м',
  '48 м',
  'Другой',
];

const TIME_SLOTS = [
  '08:00–10:00',
  '10:00–12:00',
  '12:00–14:00',
  '14:00–16:00',
  '16:00–18:00',
  '18:00–20:00',
];

type FormState = {
  materialType: MaterialType | null;
  concreteGrade: ConcreteGrade | null;
  concreteClass: string;
  mobility: string;
  frostResistance: string;
  waterResistance: string;
  hasFiber: boolean;
  additionalWishes: string;
  quantity: number;
  pumpRequired: boolean | null;
  pumpType: PumpType | null;
  pumpLength: string;
  pumpNote: string;
  addressText: string;
  latitude: number;
  longitude: number;
  // true, если latitude/longitude реально соответствуют addressText (успешный
  // геокодинг/перетаскивание точки), а не остались от предыдущего адреса или
  // от дефолтного центра Москвы — см. comment у проверки в next().
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
function availableTimeSlotsFor(dateOption: FormState['dateOption']): string[] {
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

  const [submitted, setSubmitted] = useState<{
    orderNumber: string;
  } | null>(null);

  const [form, setForm] = useState<FormState>({
    materialType: null,
    concreteGrade: null,

    concreteClass: '',
    mobility: '',
    frostResistance: '',
    waterResistance: '',
    hasFiber: false,
    additionalWishes: '',

    quantity: 10,

    pumpRequired: null,
    pumpType: null,
    pumpLength: '',
    pumpNote: '',

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

  const steps = useMemo(() => {
    const isConcrete = form.materialType === 'CONCRETE';

    const list = ['material'];

    if (isConcrete) {
      list.push('grade', 'specs');
    }

    list.push(
      'quantity',
      'pump',
      'address',
      'datetime',
      'contact',
      'summary'
    );

    return list;
  }, [form.materialType]);

  const [stepIdx, setStepIdx] = useState(0);

  const step = steps[stepIdx];

  const availableTimeSlots = useMemo(
    () => availableTimeSlotsFor(form.dateOption),
    [form.dateOption]
  );

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /** Смена даты доставки — заодно сбрасываем ранее выбранный слот времени:
   * он мог относиться к другому дню и больше не быть актуальным (например,
   * уже прошедшее время при переключении на «Сегодня»). */
  function selectDateOption(option: FormState['dateOption']) {
    setForm((current) => ({
      ...current,
      dateOption: option,
      timeSlot: '',
    }));
  }

  function next() {
    setError(null);

    if (step === 'material' && !form.materialType) {
      return setError('Выберите материал');
    }

    if (step === 'grade' && !form.concreteGrade) {
      return setError('Выберите марку бетона');
    }

    if (
      step === 'quantity' &&
      (!form.quantity || form.quantity < 1)
    ) {
      return setError('Укажите количество');
    }

    if (
      step === 'pump' &&
      form.pumpRequired === null
    ) {
      return setError('Выберите, нужен ли насос');
    }

    if (
      step === 'pump' &&
      form.pumpRequired &&
      !form.pumpType
    ) {
      return setError('Выберите тип насоса');
    }

    if (
      step === 'address' &&
      form.addressText.trim().length < 3
    ) {
      return setError('Укажите адрес доставки');
    }

    // Текст адреса есть, но координаты ему могут не соответствовать —
    // например, поиск не нашёл введённый текст (опечатка) или ещё не
    // завершился. Без этой проверки заказ мог уйти с адресом в тексте, но
    // с координатами по умолчанию (центр Москвы) или от предыдущего адреса —
    // это и была причина жалобы "адрес не синхронизируется".
    if (step === 'address' && !form.addressResolved) {
      return setError(
        'Нажмите «Найти» рядом с адресом или отметьте точку на карте, чтобы подтвердить местоположение',
      );
    }

    if (
      step === 'datetime' &&
      !form.timeSlot
    ) {
      return setError('Выберите время доставки');
    }

    if (step === 'contact') {
      if (form.contactName.trim().length < 2) {
        return setError('Укажите имя');
      }

      if (form.contactPhone.trim().length < 5) {
        return setError('Укажите телефон');
      }

      if (!isAuthenticated) {
        if (
          !form.guestEmail ||
          !form.guestEmail.includes('@')
        ) {
          return setError('Укажите корректный email');
        }

        if (
          !form.guestPassword ||
          form.guestPassword.length < 6
        ) {
          return setError(
            'Пароль должен быть не короче 6 символов'
          );
        }
      }
    }

    setStepIdx((current) =>
      Math.min(current + 1, steps.length - 1)
    );
  }

  function back() {
    setError(null);

    setStepIdx((current) =>
      Math.max(current - 1, 0)
    );
  }

  function groupIndexFor(s: string) {
    if (s === 'material') return 0;

    if (
      [
        'grade',
        'specs',
        'quantity',
        'pump',
      ].includes(s)
    ) {
      return 1;
    }

    if (
      [
        'address',
        'datetime',
      ].includes(s)
    ) {
      return 2;
    }

    if (s === 'contact') return 3;

    return 4;
  }

  function handleSubmit() {
    setError(null);

    const deliveryDate =
      form.dateOption === 'today'
        ? todayISO()
        : form.dateOption === 'tomorrow'
          ? todayISO(1)
          : form.customDate;

    const [timeFrom, timeTo] =
      form.timeSlot.split('–');

    startTransition(async () => {
      const result = await submitOrder({
        materialType: form.materialType,

        concreteGrade:
          form.materialType === 'CONCRETE'
            ? form.concreteGrade
            : undefined,

        quantity: form.quantity,

        concreteClass:
          form.concreteClass || undefined,

        mobility:
          form.mobility || undefined,

        frostResistance:
          form.frostResistance || undefined,

        waterResistance:
          form.waterResistance || undefined,

        hasFiber: form.hasFiber,

        additionalWishes:
          form.additionalWishes || undefined,

        pumpRequired: !!form.pumpRequired,

        pumpType:
          form.pumpRequired
            ? form.pumpType ?? undefined
            : undefined,

        pumpLength:
          form.pumpRequired
            ? form.pumpLength || undefined
            : undefined,

        pumpNote:
          form.pumpRequired
            ? form.pumpNote || undefined
            : undefined,

        addressText: form.addressText,

        latitude: form.latitude,

        longitude: form.longitude,

        deliveryDate,

        deliveryTimeFrom: timeFrom,

        deliveryTimeTo: timeTo,

        contactName: form.contactName,

        contactPhone: form.contactPhone,

        comment:
          form.comment || undefined,

        guestEmail:
          isAuthenticated
            ? undefined
            : form.guestEmail,

        guestPassword:
          isAuthenticated
            ? undefined
            : form.guestPassword,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSubmitted({
        orderNumber: result.orderNumber,
      });

      router.refresh();
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <div className="text-5xl">
          ✅
        </div>

        <h1 className="mt-4 text-2xl font-bold text-navy-800">
          Заказ {submitted.orderNumber} создан
        </h1>

        <p className="mt-2 text-navy-500">
          Мы отправили заявку подходящим заводам.
          Как только один из заводов подтвердит
          заказ, вы увидите информацию в разделе
          «Мои заказы».
        </p>

        <button
          className="btn-primary mt-6"
          onClick={() =>
            router.push('/client/orders')
          }
        >
          Перейти к моим заказам
        </button>
      </div>
    );
  }

  const footer = (
    <div className="flex gap-3">
      {step !== 'summary' && (
        <button
          type="button"
          onClick={next}
          className="btn-primary w-full"
        >
          Продолжить
        </button>
      )}

      {step === 'summary' && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary w-full"
        >
          {isPending
            ? 'Оформляем…'
            : 'Подтвердить заказ'}
        </button>
      )}
    </div>
  );

  return (
    <StepShell
      title={stepTitle(step)}
      subtitle={stepSubtitle(step)}
      groupIndex={groupIndexFor(step)}
      onBack={
        stepIdx > 0
          ? back
          : undefined
      }
      footer={footer}
    >
      {error && (
        <p className="field-error mb-4">
          {error}
        </p>
      )}

      {step === 'material' && (
        <div className="grid grid-cols-2 gap-3">
          {(
            Object.keys(
              MATERIAL_LABELS
            ) as MaterialType[]
          ).map((material) => (
            <SelectableCard
              key={material}
              label={
                MATERIAL_LABELS[material]
              }
              selected={
                form.materialType === material
              }
              onClick={() =>
                update(
                  'materialType',
                  material
                )
              }
            />
          ))}
        </div>
      )}

      {step === 'grade' && (
        <div className="grid grid-cols-3 gap-3">
          {CONCRETE_GRADES.map((grade) => (
            <SelectableCard
              key={grade}
              label={grade}
              selected={
                form.concreteGrade === grade
              }
              onClick={() =>
                update(
                  'concreteGrade',
                  grade
                )
              }
            />
          ))}
        </div>
      )}

      {step === 'specs' && (
        <div className="space-y-4">
          <p className="text-sm text-navy-400">
            Необязательные параметры —
            можно пропустить.
          </p>

          <div>
            <label className="field-label">
              Класс бетона
            </label>

            <input
              className="field-input"
              value={form.concreteClass}
              onChange={(event) =>
                update(
                  'concreteClass',
                  event.target.value
                )
              }
              placeholder="например, B22.5"
            />
          </div>

          <div>
            <label className="field-label">
              Подвижность
            </label>

            <input
              className="field-input"
              value={form.mobility}
              onChange={(event) =>
                update(
                  'mobility',
                  event.target.value
                )
              }
              placeholder="например, П3"
            />
          </div>

          <div>
            <label className="field-label">
              Морозостойкость
            </label>

            <input
              className="field-input"
              value={
                form.frostResistance
              }
              onChange={(event) =>
                update(
                  'frostResistance',
                  event.target.value
                )
              }
              placeholder="например, F150"
            />
          </div>

          <div>
            <label className="field-label">
              Водонепроницаемость
            </label>

            <input
              className="field-input"
              value={
                form.waterResistance
              }
              onChange={(event) =>
                update(
                  'waterResistance',
                  event.target.value
                )
              }
              placeholder="например, W6"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input
              type="checkbox"
              checked={form.hasFiber}
              onChange={(event) =>
                update(
                  'hasFiber',
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded border-surface-border"
            />

            Нужна фибра
          </label>

          <div>
            <label className="field-label">
              Дополнительные пожелания
            </label>

            <textarea
              className="field-input"
              rows={3}
              value={
                form.additionalWishes
              }
              onChange={(event) =>
                update(
                  'additionalWishes',
                  event.target.value
                )
              }
            />
          </div>
        </div>
      )}

      {step === 'quantity' && (
        <div>
          <label className="field-label">
            Количество, м³
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                update(
                  'quantity',
                  Math.max(
                    1,
                    form.quantity - 1
                  )
                )
              }
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface-border text-2xl text-navy-600 hover:bg-surface-border"
              aria-label="Уменьшить"
            >
              −
            </button>

            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) =>
                update(
                  'quantity',
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    ) || 1
                  )
                )
              }
              className="field-input text-center text-xl font-semibold"
            />

            <button
              type="button"
              onClick={() =>
                update(
                  'quantity',
                  form.quantity + 1
                )
              }
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface-border text-2xl text-navy-600 hover:bg-surface-border"
              aria-label="Увеличить"
            >
              +
            </button>
          </div>

          <p className="mt-2 text-sm text-navy-400">
            Минимальное значение — 1 м³
          </p>
        </div>
      )}

      {step === 'pump' && (
        <div className="space-y-5">
          <div>
            <p className="field-label">
              Нужен ли бетононасос?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <SelectableCard
                label="Да"
                selected={
                  form.pumpRequired === true
                }
                onClick={() =>
                  update(
                    'pumpRequired',
                    true
                  )
                }
              />

              <SelectableCard
                label="Нет"
                selected={
                  form.pumpRequired === false
                }
                onClick={() =>
                  update(
                    'pumpRequired',
                    false
                  )
                }
              />
            </div>
          </div>

          {form.pumpRequired && (
            <>
              <div>
                <p className="field-label">
                  Какой насос нужен?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      'AUTO',
                      'STATIONARY',
                    ] as PumpType[]
                  ).map((type) => (
                    <SelectableCard
                      key={type}
                      label={
                        PUMP_TYPE_LABELS[
                          type
                        ]
                      }
                      selected={
                        form.pumpType ===
                        type
                      }
                      onClick={() =>
                        update(
                          'pumpType',
                          type
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {form.pumpType ===
                'AUTO' && (
                <div>
                  <p className="field-label">
                    Вылет стрелы
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {AUTO_PUMP_LENGTHS.map(
                      (length) => (
                        <SelectableCard
                          key={length}
                          label={length}
                          selected={
                            form.pumpLength ===
                            length
                          }
                          onClick={() =>
                            update(
                              'pumpLength',
                              length
                            )
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">
                  Дополнительная информация
                  о насосе
                </label>

                <textarea
                  className="field-input"
                  rows={2}
                  value={form.pumpNote}
                  onChange={(event) =>
                    update(
                      'pumpNote',
                      event.target.value
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      )}

      {step === 'address' && (
        <div className="space-y-4">
          <YandexAddressMap
            address={form.addressText}
            latitude={form.latitude}
            longitude={form.longitude}
            onAddressChange={(address) =>
              update('addressText', address)
            }
            onManualEdit={() =>
              update('addressResolved', false)
            }
            onChange={(
              latitude,
              longitude
            ) => {
              setForm((current) => ({
                ...current,
                latitude,
                longitude,
                addressResolved: true,
              }));
            }}
          />
        </div>
      )}

      {step === 'datetime' && (
        <div className="space-y-5">
          <div>
            <p className="field-label">
              Дата доставки
            </p>

            <div className="grid grid-cols-3 gap-3">
              <SelectableCard
                label="Сегодня"
                selected={
                  form.dateOption ===
                  'today'
                }
                onClick={() =>
                  selectDateOption('today')
                }
              />

              <SelectableCard
                label="Завтра"
                selected={
                  form.dateOption ===
                  'tomorrow'
                }
                onClick={() =>
                  selectDateOption('tomorrow')
                }
              />

              <SelectableCard
                label="Выбрать дату"
                selected={
                  form.dateOption ===
                  'custom'
                }
                onClick={() =>
                  selectDateOption('custom')
                }
              />
            </div>

            {form.dateOption ===
              'custom' && (
              <input
                type="date"
                className="field-input mt-3"
                min={todayISO()}
                value={
                  form.customDate
                }
                onChange={(event) =>
                  update(
                    'customDate',
                    event.target.value
                  )
                }
              />
            )}
          </div>

          <div>
            <p className="field-label">
              Время доставки
            </p>

            {availableTimeSlots.length === 0 && (
              <p className="mb-3 text-sm text-navy-400">
                На сегодня подходящих слотов уже нет — выберите «Завтра» или другую дату.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {availableTimeSlots.map(
                (time) => (
                  <SelectableCard
                    key={time}
                    label={time}
                    selected={
                      form.timeSlot ===
                      time
                    }
                    onClick={() =>
                      update(
                        'timeSlot',
                        time
                      )
                    }
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="field-label">
              Имя
            </label>

            <input
              className="field-input"
              value={form.contactName}
              onChange={(event) =>
                update(
                  'contactName',
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Телефон
            </label>

            <input
              className="field-input"
              type="tel"
              value={
                form.contactPhone
              }
              onChange={(event) =>
                update(
                  'contactPhone',
                  event.target.value
                )
              }
              placeholder="+7 900 000-00-00"
            />
          </div>

          <div>
            <label className="field-label">
              Комментарий
            </label>

            <textarea
              className="field-input"
              rows={2}
              value={form.comment}
              onChange={(event) =>
                update(
                  'comment',
                  event.target.value
                )
              }
              placeholder="Например, позвонить за 30 минут до приезда"
            />
          </div>

          {!isAuthenticated && (
            <div className="rounded-xl border border-dashed border-surface-border p-4">
              <p className="mb-3 text-sm text-navy-500">
                Укажите email и пароль,
                чтобы отслеживать статус
                заказа в личном кабинете.
                Если у вас уже есть аккаунт
                БСБ — просто войдите теми же
                данными.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="field-label">
                    Email
                  </label>

                  <input
                    className="field-input"
                    type="email"
                    value={
                      form.guestEmail
                    }
                    onChange={(event) =>
                      update(
                        'guestEmail',
                        event.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="field-label">
                    Пароль
                  </label>

                  <input
                    className="field-input"
                    type="password"
                    value={
                      form.guestPassword
                    }
                    onChange={(event) =>
                      update(
                        'guestPassword',
                        event.target.value
                      )
                    }
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
            <h2 className="font-semibold text-navy-800">
              Ваш заказ
            </h2>

            <SummaryRow
              label="Материал"
              value={
                MATERIAL_LABELS[
                  form.materialType!
                ]
              }
            />

            {form.materialType ===
              'CONCRETE' && (
              <SummaryRow
                label="Марка"
                value={
                  form.concreteGrade ??
                  '—'
                }
              />
            )}

            <SummaryRow
              label="Количество"
              value={`${form.quantity} м³`}
            />

            <SummaryRow
              label="Бетононасос"
              value={
                form.pumpRequired
                  ? `${
                      PUMP_TYPE_LABELS[
                        form.pumpType ??
                          'AUTO'
                      ]
                    }${
                      form.pumpLength
                        ? ` ${form.pumpLength}`
                        : ''
                    }`
                  : 'Не требуется'
              }
            />

            <SummaryRow
              label="Адрес"
              value={form.addressText}
            />

            <SummaryRow
              label="Дата"
              value={
                form.dateOption ===
                'today'
                  ? 'Сегодня'
                  : form.dateOption ===
                      'tomorrow'
                    ? 'Завтра'
                    : form.customDate
              }
            />

            <SummaryRow
              label="Время"
              value={form.timeSlot}
            />

            {form.comment && (
              <SummaryRow
                label="Комментарий"
                value={form.comment}
              />
            )}

            <SummaryRow
              label="Контакт"
              value={`${form.contactName}, ${form.contactPhone}`}
            />
          </div>
        </div>
      )}
    </StepShell>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-t border-surface-border pt-2.5 first:border-0 first:pt-0">
      <span className="text-sm text-navy-400">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-navy-800">
        {value}
      </span>
    </div>
  );
}

function stepTitle(step: string) {
  switch (step) {
    case 'material':
      return 'Что нужно?';

    case 'grade':
      return 'Марка бетона';

    case 'specs':
      return 'Характеристики бетона';

    case 'quantity':
      return 'Сколько бетона нужно?';

    case 'pump':
      return 'Бетононасос';

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

function stepSubtitle(step: string) {
  switch (step) {
    case 'material':
      return 'Выберите строительный материал';

    case 'quantity':
      return 'Укажите объём в кубических метрах';

    case 'contact':
      return 'Мы свяжемся с вами по указанному телефону';

    default:
      return undefined;
  }
}
