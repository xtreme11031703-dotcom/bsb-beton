import Link from 'next/link';
import { getSession } from '@/lib/session';
import { Logo } from './Logo';
import { logout } from '@/app/actions/auth';
import { company } from '@/lib/company';
import { MobileNav } from './MobileNav';

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {company.nav.map((item) =>
            'href' in item ? (
              <Link key={item.href} href={item.href} className="btn-ghost">
                {item.label}
              </Link>
            ) : (
              <div key={item.label} className="group relative">
                <button type="button" className="btn-ghost inline-flex items-center gap-1">
                  {item.label}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="mt-px transition-transform duration-150 group-hover:rotate-180"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="invisible absolute left-0 top-full z-40 w-64 rounded-2xl border border-surface-border bg-white p-2 opacity-0 shadow-lift transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-surface-muted hover:text-navy-900"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {!session && (
              <>
                <Link href="/order/new" className="hidden sm:inline-flex btn-ghost">
                  Заказать бетон
                </Link>
                <Link href="/login" className="btn-secondary !px-4 !py-2 text-sm">
                  Войти
                </Link>
              </>
            )}
            {session?.role === 'CLIENT' && (
              <>
                <Link href="/client/orders" className="btn-ghost">
                  Мои заказы
                </Link>
                <form action={logout}>
                  <button className="btn-ghost">Выйти</button>
                </form>
              </>
            )}
            {session?.role === 'PLANT' && (
              <>
                <span className="hidden text-sm text-navy-400 sm:inline">{session.name}</span>
                <Link href="/plant" className="btn-ghost">
                  Заказы
                </Link>
                <form action={logout}>
                  <button className="btn-ghost">Выйти</button>
                </form>
              </>
            )}
            {session?.role === 'ADMIN' && (
              <>
                <Link href="/admin" className="btn-ghost">
                  Админка
                </Link>
                <form action={logout}>
                  <button className="btn-ghost">Выйти</button>
                </form>
              </>
            )}
          </div>

          <MobileNav loggedIn={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
