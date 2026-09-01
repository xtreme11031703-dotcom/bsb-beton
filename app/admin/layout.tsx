import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/plants', label: 'Заводы' },
  { href: '/admin/clients', label: 'Клиенты' },
  { href: '/admin/map', label: 'Карта' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
                className="block rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-surface-border"
              >
                {item.label}
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
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
