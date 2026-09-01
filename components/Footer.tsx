import Link from 'next/link';
import { Logo } from './Logo';
import { company } from '@/lib/company';

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-navy-500">{company.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-700">Разделы</h3>
          <ul className="mt-3 space-y-2">
            {company.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-navy-500 hover:text-navy-800">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-700">Контакты</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-500">
            <li>
              <a href={company.phoneHref} className="hover:text-navy-800">
                {company.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${company.email}`} className="hover:text-navy-800">
                {company.email}
              </a>
            </li>
            <li>{company.workHours}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-700">Заказать</h3>
          <p className="mt-3 text-sm text-navy-500">
            Оформите заявку на доставку бетона онлайн — это займёт пару минут.
          </p>
          <Link href="/order/new" className="btn-primary mt-4 !px-5 !py-2.5 text-sm">
            Заказать бетон
          </Link>
        </div>
      </div>

      <div className="border-t border-surface-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-navy-400 sm:px-6">
          © {new Date().getFullYear()} {company.fullName}. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
