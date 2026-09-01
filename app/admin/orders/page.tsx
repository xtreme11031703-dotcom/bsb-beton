import { listAllOrders, listAllPlants } from '@/app/actions/admin';
import { MATERIAL_LABELS, ORDER_STATUS_LABELS } from '@/lib/utils';
import { OrderActions } from './OrderActions';

export default async function AdminOrdersPage() {
  const [orders, plants] = await Promise.all([listAllOrders(), listAllPlants()]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Заказы</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-muted text-navy-500">
            <tr>
              <th className="px-4 py-3 font-medium">№ заказа</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Материал</th>
              <th className="px-4 py-3 font-medium">Кол-во</th>
              <th className="px-4 py-3 font-medium">Адрес</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Завод</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = ORDER_STATUS_LABELS[order.status];
              return (
                <tr key={order.id} className="border-b border-surface-border last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-800">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-navy-600">{order.client.name}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {MATERIAL_LABELS[order.materialType]}
                    {order.concreteGrade ? ` ${order.concreteGrade}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{order.quantity} м³</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-navy-600">{order.addressText}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{order.plant?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {status.emoji} {status.label}
                  </td>
                  <td className="px-4 py-3">
                    <OrderActions
                      orderId={order.id}
                      currentStatus={order.status}
                      hasPlant={!!order.plantId}
                      plants={plants.map((p) => ({ id: p.id, name: p.name }))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
