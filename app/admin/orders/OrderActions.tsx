'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeOrderStatus, cancelOrder, assignOrderManually } from '@/app/actions/admin';
import { ORDER_STATUS_LABELS } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

const STATUS_OPTIONS: OrderStatus[] = [
  'NEW',
  'SEARCHING_PLANT',
  'PLANT_ASSIGNED',
  'CONFIRMED',
  'IN_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export function OrderActions({
  orderId,
  currentStatus,
  hasPlant,
  plants,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  hasPlant: boolean;
  plants: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={(e) => {
          const status = e.target.value as OrderStatus;
          startTransition(async () => {
            await changeOrderStatus(orderId, status);
            router.refresh();
          });
        }}
        className="rounded-lg border border-surface-border bg-white px-2 py-1.5 text-xs text-navy-700 transition-colors hover:border-navy-300 focus:border-navy-500 focus:outline-none disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]?.label ?? s}
          </option>
        ))}
      </select>

      {!hasPlant && plants.length > 0 && (
        <select
          defaultValue=""
          disabled={isPending}
          onChange={(e) => {
            const plantId = e.target.value;
            if (!plantId) return;
            startTransition(async () => {
              await assignOrderManually(orderId, plantId);
              router.refresh();
            });
          }}
          className="rounded-lg border border-surface-border bg-white px-2 py-1.5 text-xs text-navy-700 transition-colors hover:border-navy-300 focus:border-navy-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">Назначить завод…</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {currentStatus !== 'CANCELLED' && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await cancelOrder(orderId);
              router.refresh();
            })
          }
          className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          Отменить
        </button>
      )}
    </div>
  );
}
