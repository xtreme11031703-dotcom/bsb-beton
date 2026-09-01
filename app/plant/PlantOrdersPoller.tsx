'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PlantOrdersPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 6000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
