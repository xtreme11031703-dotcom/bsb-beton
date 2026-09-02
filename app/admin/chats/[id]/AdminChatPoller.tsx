'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Обновляет страницу диалога раз в 5 секунд, пока админ её открыл — MVP-замена
 * realtime, тот же приём, что и в OrderStatusPoller/PlantOrdersPoller. */
export function AdminChatPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
