'use client';

import { useState } from 'react';
import Link from 'next/link';
import { company } from '@/lib/company';

export function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-700 hover:bg-surface-border"
      >
        <span className="relative block h-4 w-5">
          <span
            className="absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform"
            style={{ transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }}
          />
          <span
            className="absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="absolute left-0 top-3 h-0.5 w-5 bg-current transition-transform"
            style={{ transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
          />
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[57px] z-20 border-b border-surface-border bg-white p-4 shadow-card">
          <nav className="flex flex-col gap-1">
            {company.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-base font-medium text-navy-700 hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-surface-border pt-3">
              <Link href="/order/new" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                Заказать бетон
              </Link>
              {!loggedIn && (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-sm">
                  Войти
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
