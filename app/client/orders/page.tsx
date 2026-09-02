import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { getClientOrders } from '@/app/actions/orders';
import { getTelegramStatus } from '@/app/actions/telegram';
import { TelegramLinkCard } from '@/components/TelegramLinkCard';
import { StatusBadge } from '@/components/StatusBadge';
import { MATERIAL_LABELS } from '@/lib/utils';

export default async function ClientOrdersPage() {
  const [orders, telegramStatus] = await Promise.all([getClientOrders(), getTelegramStatus()]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy-800">Мои заказы</h1>
          <Link href="/order/new" className="btn-primary !px-4 !py-2.5 text-sm">
            Новый заказ
          </Link>
        </div>

        {telegramStatus && (
          <div className="mb-6">
            <TelegramLinkCard
              initialLinked={telegramStatus.linked}
              initialCode={telegramStatus.linked ? null : telegramStatus.code}
            />
          </div>
        )}

        {orders.length === 0 ? (
          <div className="card text-center">
            <p className="text-navy-500">У вас пока нет заказов.</p>
            <Link href="/order/new" className="btn-primary mt-4 inline-flex">
              Заказать бетон
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/client/orders/${order.id}`}
                className="card card-hover block"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-navy-800">{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1.5 text-sm text-navy-500">
                  {MATERIAL_LABELS[order.materialType]}
                  {order.concreteGrade ? ` • ${order.concreteGrade}` : ''} • {order.quantity} м³
                </p>
                <p className="mt-1 text-sm text-navy-400">{order.addressText}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
