'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MVP-замена realtime: обновляет страницу раз в 7 секунд, пока заказ не завершён/не отменён.
 * В боевой версии — заменить на Supabase Realtime или WebSocket.
 */
export function OrderStatusPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 7000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
