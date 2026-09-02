'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

// Ссылка на корзину в шапке сайта — видна всегда (корзина не привязана к
// аккаунту), с бейджем количества позиций, когда корзина не пуста. Ведёт в
// мастер заказа (/order/new), который сразу открывается на шаге "Корзина",
// если в ней уже что-то есть (см. OrderWizard.tsx).
export function CartBadge() {
  const { count } = useCart();

  return (
    <Link href="/order/new" className="btn-ghost relative inline-flex items-center gap-1.5">
      Корзина
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
