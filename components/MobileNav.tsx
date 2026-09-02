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
            {company.nav.map((item) =>
              'href' in item ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-base font-medium text-navy-700 hover:bg-surface-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <details key={item.label} className="group rounded-xl">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium text-navy-700 hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="transition-transform duration-150 group-open:rotate-180"
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-surface-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-navy-500 hover:bg-surface-muted hover:text-navy-800"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              )
            )}
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
