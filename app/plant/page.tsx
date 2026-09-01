import { SiteHeader } from '@/components/SiteHeader';
import { getPlantOrders } from '@/app/actions/plants';
import { getTelegramStatus } from '@/app/actions/telegram';
import { TelegramLinkCard } from '@/components/TelegramLinkCard';
import { MATERIAL_LABELS, ORDER_STATUS_LABELS, PUMP_TYPE_LABELS } from '@/lib/utils';
import { TakeOrderButton } from './TakeOrderButton';
import { PlantOrdersPoller } from './PlantOrdersPoller';

export default async function PlantDashboardPage() {
  const [data, telegramStatus] = await Promise.all([getPlantOrders(), getTelegramStatus()]);
  if (!data) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <p className="text-navy-500">Недостаточно прав для просмотра этой страницы.</p>
        </main>
      </div>
    );
  }

  const { available, mine } = data;
  const active = mine.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completed = mine.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <PlantOrdersPoller />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800">Заказы</h1>

        {telegramStatus && (
          <div className="mt-4">
            <TelegramLinkCard
              initialLinked={telegramStatus.linked}
              initialCode={telegramStatus.linked ? null : telegramStatus.code}
            />
          </div>
        )}

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase text-navy-400">
            Новые ({available.length})
          </h2>
          {available.length === 0 ? (
            <p className="card text-sm text-navy-400">Пока нет доступных заказов.</p>
          ) : (
            <div className="space-y-3">
              {available.map(({ order, distanceKm }) => (
                <div key={order.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy-800">{order.orderNumber}</span>
                    <span className="text-xs text-navy-400">{distanceKm ?? '—'} км</span>
                  </div>
                  <p className="mt-1 text-sm text-navy-600">
                    {MATERIAL_LABELS[order.materialType]}
                    {order.concreteGrade ? ` ${order.concreteGrade}` : ''} • {order.quantity} м³
                  </p>
                  <p className="mt-1 text-sm text-navy-400">{order.addressText}</p>
                  <p className="mt-1 text-sm text-navy-400">
                    {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}, {order.deliveryTimeFrom}–
                    {order.deliveryTimeTo}
                  </p>
                  {order.pumpRequired && (
                    <p className="mt-1 text-sm text-navy-400">
                      Насос: {PUMP_TYPE_LABELS[order.pumpType ?? 'AUTO']}
                      {order.pumpLength ? ` ${order.pumpLength}` : ''}
                    </p>
                  )}
                  <TakeOrderButton orderId={order.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase text-navy-400">
            Принятые и в работе ({active.length})
          </h2>
          {active.length === 0 ? (
            <p className="card text-sm text-navy-400">Пока нет принятых заказов.</p>
          ) : (
            <div className="space-y-3">
              {active.map((order) => (
                <div key={order.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy-800">{order.orderNumber}</span>
                    <span className="text-sm">
                      {ORDER_STATUS_LABELS[order.status].emoji} {ORDER_STATUS_LABELS[order.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-navy-600">
                    {MATERIAL_LABELS[order.materialType]}
                    {order.concreteGrade ? ` ${order.concreteGrade}` : ''} • {order.quantity} м³
                  </p>
                  <p className="mt-1 text-sm text-navy-400">{order.addressText}</p>
                  <p className="mt-1 text-sm font-medium text-navy-700">
                    {order.contactName} · {order.contactPhone}
                  </p>
                  {order.comment && <p className="mt-1 text-sm text-navy-400">Комментарий: {order.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {completed.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase text-navy-400">
              Завершённые и отменённые ({completed.length})
            </h2>
            <div className="space-y-3">
              {completed.map((order) => (
                <div key={order.id} className="card opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy-800">{order.orderNumber}</span>
                    <span className="text-sm">
                      {ORDER_STATUS_LABELS[order.status].emoji} {ORDER_STATUS_LABELS[order.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
