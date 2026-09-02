import { listAllOrders, listAllPlants } from '@/app/actions/admin';
import { summarizeOrderItems } from '@/lib/catalog';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderActions } from './OrderActions';

export default async function AdminOrdersPage() {
  const [orders, plants] = await Promise.all([listAllOrders(), listAllPlants()]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">Заказы</h1>
        <span className="text-sm text-navy-400">Всего: {orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center text-sm text-navy-400">Пока нет ни одного заказа.</div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">№ заказа</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Товары</th>
                <th className="px-4 py-3">Адрес</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Завод</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/60">
                  <td className="px-4 py-3.5 font-medium text-navy-800">{order.orderNumber}</td>
                  <td className="px-4 py-3.5 text-navy-600">{order.client.name}</td>
                  <td className="max-w-[240px] truncate px-4 py-3.5 text-navy-600" title={summarizeOrderItems(order.items)}>
                    {summarizeOrderItems(order.items)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3.5 text-navy-600" title={order.addressText}>
                    {order.addressText}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-navy-600">
                    {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3.5 text-navy-600">{order.plant?.name ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <OrderActions
                      orderId={order.id}
                      currentStatus={order.status}
                      hasPlant={!!order.plantId}
                      plants={plants.map((p) => ({ id: p.id, name: p.name }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
