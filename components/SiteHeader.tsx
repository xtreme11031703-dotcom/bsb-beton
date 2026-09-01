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
          {company.nav.map((item) => (
            <Link key={item.href} href={item.href} className="btn-ghost">
              {item.label}
            </Link>
          ))}
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
