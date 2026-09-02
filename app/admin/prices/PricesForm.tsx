'use client';

import { useState, useTransition } from 'react';
import { updateCatalogPrices, type AdminPriceRow } from '@/app/actions/catalog-prices';

type Group = { category: string; label: string; items: AdminPriceRow[] };

export function PricesForm({ groups }: { groups: Group[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await updateCatalogPrices(formData);
          setMessage(result.ok ? { ok: true, text: 'Цены сохранены' } : { ok: false, text: result.error });
        });
      }}
      className="space-y-6 pb-24"
    >
      {groups.map((group) => (
        <div key={group.category} className="card">
          <h2 className="mb-3 font-semibold text-navy-800">{group.label}</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2"
              >
                <span className="text-sm text-navy-600">{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <input
                    type="number"
                    name={`price:${item.id}`}
                    defaultValue={item.currentPrice}
                    min={0}
                    step={1}
                    className="field-input w-24 !py-1.5 text-right text-sm"
                  />
                  <span className="text-xs text-navy-400">₽</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? 'Сохраняем…' : 'Сохранить все цены'}
          </button>
          {message && (
            <span className={`text-sm font-medium ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
