import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { getUnreadChatCount } from '@/app/actions/admin';

const NAV = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/plants', label: 'Заводы' },
  { href: '/admin/clients', label: 'Клиенты' },
  { href: '/admin/prices', label: 'Цены' },
  { href: '/admin/blog', label: 'Блог' },
  { href: '/admin/settings', label: 'Инфо о сайте' },
  { href: '/admin/map', label: 'Карта' },
  { href: '/admin/chats', label: 'Чат' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const unreadChats = await getUnreadChatCount();

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-48 shrink-0 sm:block">
          <nav className="card sticky top-20 space-y-1 p-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-surface-border"
              >
                {item.label}
                {item.href === '/admin/chats' && unreadChats > 0 && <UnreadBadge count={unreadChats} />}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 overflow-x-auto">
          <nav className="mb-4 flex gap-2 overflow-x-auto sm:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-navy-600"
              >
                {item.label}
                {item.href === '/admin/chats' && unreadChats > 0 && (
                  <span className="ml-1.5">
                    <UnreadBadge count={unreadChats} />
                  </span>
                )}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
