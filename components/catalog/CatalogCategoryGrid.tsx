'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import {
  AUTO_PUMP_SKUS,
  BETON_SKUS,
  CONCRETE_AGGREGATE_LABELS,
  MORTAR_KIND_LABELS,
  MORTAR_SKUS,
  POLISTIROLBETON_SKUS,
  PUMP_TYPE_LABELS,
  STATIONARY_PUMP_SKUS,
  TOSHCHIY_BETON_SKUS,
  VYSOKOPROCHNYY_BETON_SKUS,
  emptyCartItem,
  formatPrice,
  type BetonSku,
  type MortarSku,
  type PumpSku,
} from '@/lib/catalog';
import type { ConcreteAggregate, MortarKind, ProductCategory, PumpType } from '@prisma/client';

// Интерактивная часть страницы категории каталога (app/catalog/[category]) —
// вынесена из серверного page.tsx, потому что нужен доступ к общей корзине
// (lib/cart-context.tsx) и локальное состояние переключения вкладок
// (наполнитель/вид раствора/тип насоса) и количества у карточек товаров.
export function CatalogCategoryGrid({ category }: { category: ProductCategory }) {
  switch (category) {
    case 'BETON':
      return <BetonGrid />;
    case 'TOSHCHIY_BETON':
      return <FlatBetonGrid category={category} skus={TOSHCHIY_BETON_SKUS} />;
    case 'VYSOKOPROCHNYY_BETON':
      return <FlatBetonGrid category={category} skus={VYSOKOPROCHNYY_BETON_SKUS} />;
    case 'POLISTIROLBETON':
      return <FlatBetonGrid category={category} skus={POLISTIROLBETON_SKUS} />;
    case 'RASTVORY':
      return <RastvoryGrid />;
    case 'NASOS':
      return <NasosGrid />;
    default:
      return null;
  }
}

function AddedToast({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="ml-2 text-sm font-medium text-green-600">Добавлено ✓</span>;
}

function useAddedFlash() {
  const [addedKey, setAddedKey] = useState<string | null>(null);
  function flash(key: string) {
    setAddedKey(key);
    setTimeout(() => setAddedKey((current) => (current === key ? null : current)), 1500);
  }
  return { addedKey, flash };
}

function ContinueToCartLink() {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.push('/order/new')} className="btn-secondary mt-6">
      Перейти в корзину →
    </button>
  );
}

function BetonGrid() {
  const { addItem } = useCart();
  const [aggregate, setAggregate] = useState<ConcreteAggregate>('GRAVEL');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addedKey, flash } = useAddedFlash();

  const skus = BETON_SKUS[aggregate];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(CONCRETE_AGGREGATE_LABELS) as ConcreteAggregate[]).map((agg) => (
          <button
            key={agg}
            type="button"
            onClick={() => setAggregate(agg)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              aggregate === agg ? 'bg-navy-700 text-white' : 'bg-surface-muted text-navy-600 hover:bg-surface-border'
            }`}
          >
            {CONCRETE_AGGREGATE_LABELS[agg]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skus.map((sku) => {
          const qty = quantities[sku.grade] ?? 10;
          return (
            <SkuCard
              key={sku.grade}
              title={`Бетон ${sku.grade}, класс ${sku.classLabel}`}
              sku={sku}
              quantity={qty}
              onQuantityChange={(v) => setQuantities((c) => ({ ...c, [sku.grade]: v }))}
              added={addedKey === sku.grade}
              onAdd={() => {
                addItem({ ...emptyCartItem('BETON'), aggregate, concreteGrade: sku.grade, quantity: qty });
                flash(sku.grade);
              }}
            />
          );
        })}
      </div>

      <ContinueToCartLink />
    </div>
  );
}

function FlatBetonGrid({ category, skus }: { category: ProductCategory; skus: BetonSku[] }) {
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addedKey, flash } = useAddedFlash();

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skus.map((sku) => {
          const qty = quantities[sku.grade] ?? 10;
          return (
            <SkuCard
              key={sku.grade}
              title={`${sku.grade}, класс ${sku.classLabel}`}
              sku={sku}
              quantity={qty}
              onQuantityChange={(v) => setQuantities((c) => ({ ...c, [sku.grade]: v }))}
              added={addedKey === sku.grade}
              onAdd={() => {
                addItem({ ...emptyCartItem(category), concreteGrade: sku.grade, quantity: qty });
                flash(sku.grade);
              }}
            />
          );
        })}
      </div>

      <ContinueToCartLink />
    </div>
  );
}

function RastvoryGrid() {
  const { addItem } = useCart();
  const [mortarKind, setMortarKind] = useState<MortarKind>('CEMENT');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addedKey, flash } = useAddedFlash();

  const skus = MORTAR_SKUS[mortarKind];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(MORTAR_KIND_LABELS) as MortarKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setMortarKind(kind)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mortarKind === kind ? 'bg-navy-700 text-white' : 'bg-surface-muted text-navy-600 hover:bg-surface-border'
            }`}
          >
            {kind === 'SPECIAL' ? 'Специальные растворы' : MORTAR_KIND_LABELS[kind]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skus.map((sku) => {
          const key = sku.grade ?? sku.label ?? 'default';
          const qty = quantities[key] ?? 10;
          return (
            <SkuCard
              key={key}
              title={sku.grade ? `${MORTAR_KIND_LABELS[mortarKind]} ${sku.grade}` : sku.label!}
              sku={sku}
              quantity={qty}
              onQuantityChange={(v) => setQuantities((c) => ({ ...c, [key]: v }))}
              added={addedKey === key}
              onAdd={() => {
                addItem({ ...emptyCartItem('RASTVORY'), mortarKind, concreteGrade: sku.grade ?? null, quantity: qty });
                flash(key);
              }}
            />
          );
        })}
      </div>

      <ContinueToCartLink />
    </div>
  );
}

function NasosGrid() {
  const { addItem } = useCart();
  const [pumpType, setPumpType] = useState<PumpType>('AUTO');
  const { addedKey, flash } = useAddedFlash();

  const skus = pumpType === 'AUTO' ? AUTO_PUMP_SKUS : STATIONARY_PUMP_SKUS;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['AUTO', 'STATIONARY'] as PumpType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPumpType(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pumpType === type ? 'bg-navy-700 text-white' : 'bg-surface-muted text-navy-600 hover:bg-surface-border'
            }`}
          >
            {PUMP_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skus.map((sku) => (
          <PumpSkuCard
            key={sku.length}
            pumpType={pumpType}
            sku={sku}
            added={addedKey === sku.length}
            onAdd={() => {
              addItem({ ...emptyCartItem('NASOS'), pumpType, pumpLength: sku.length });
              flash(sku.length);
            }}
          />
        ))}
      </div>

      <ContinueToCartLink />
    </div>
  );
}

function SkuCard({
  title,
  sku,
  quantity,
  onQuantityChange,
  added,
  onAdd,
}: {
  title: string;
  sku: BetonSku | MortarSku;
  quantity: number;
  onQuantityChange: (v: number) => void;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="card flex h-full flex-col">
      <h3 className="font-semibold text-navy-800">{title}</h3>

      <dl className="mt-3 space-y-1 text-xs text-navy-400">
        {sku.classLabel && (
          <div className="flex justify-between">
            <dt>Класс</dt>
            <dd className="font-medium text-navy-600">{sku.classLabel}</dd>
          </div>
        )}
        {sku.frost && (
          <div className="flex justify-between">
            <dt>Морозостойкость</dt>
            <dd className="font-medium text-navy-600">{sku.frost}</dd>
          </div>
        )}
        {sku.water && (
          <div className="flex justify-between">
            <dt>Водонепроницаемость</dt>
            <dd className="font-medium text-navy-600">{sku.water}</dd>
          </div>
        )}
        {sku.density && (
          <div className="flex justify-between">
            <dt>Плотность, кг/м³</dt>
            <dd className="font-medium text-navy-600">{sku.density}</dd>
          </div>
        )}
      </dl>

      <p className="mt-3 text-lg font-bold text-navy-800">{formatPrice(sku.price)} <span className="text-sm font-normal text-navy-400">/ м³</span></p>

      <div className="mt-auto flex items-center gap-2 pt-3">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value) || 1))}
          className="field-input !py-2 w-20 text-center"
          aria-label="Количество, м³"
        />
        <button type="button" onClick={onAdd} className="btn-primary flex-1 !py-2 text-sm">
          В корзину
        </button>
      </div>
      <AddedToast show={added} />
    </div>
  );
}

function PumpSkuCard({
  pumpType,
  sku,
  added,
  onAdd,
}: {
  pumpType: PumpType;
  sku: PumpSku;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="card flex h-full flex-col">
      <h3 className="font-semibold text-navy-800">
        {PUMP_TYPE_LABELS[pumpType]} {sku.length}
      </h3>
      <p className="mt-3 text-lg font-bold text-navy-800">{formatPrice(sku.price)}</p>
      {sku.price === null && <p className="mt-1 text-xs text-navy-400">Цена уточняется при оформлении</p>}
      <div className="mt-auto pt-3">
        <button type="button" onClick={onAdd} className="btn-primary w-full !py-2 text-sm">
          В корзину
        </button>
      </div>
      <AddedToast show={added} />
    </div>
  );
}
