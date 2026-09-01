'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { takeOrder } from '@/app/actions/plants';

export function TakeOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="mt-3">
      {error && <p className="field-error mb-2">{error}</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await takeOrder(orderId);
            if (!result.ok) {
              setError(result.error);
              router.refresh();
              return;
            }
            router.refresh();
          });
        }}
        className="btn-primary w-full"
      >
        {isPending ? 'Берём заказ…' : 'ВЗЯТЬ ЗАКАЗ'}
      </button>
    </div>
  );
}
