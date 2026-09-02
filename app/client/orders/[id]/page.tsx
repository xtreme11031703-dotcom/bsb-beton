import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { getClientOrderById } from '@/app/actions/orders';
import { MATERIAL_LABELS, ORDER_STATUS_LABELS, PUMP_TYPE_LABELS } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { company } from '@/lib/company';
import { OrderStatusPoller } from './OrderStatusPoller';

export default async function ClientOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getClientOrderById(params.id);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/client/orders" className="text-sm text-navy-500 hover:underline">
          ← Мои заказы
        </Link>

        <div className="card mt-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-navy-800">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>

          {order.status === 'SEARCHING_PLANT' && (
            <p className="mt-2 text-sm text-navy-500">
              Мы отправили заявку подходящим заводам. Как только один из заводов подтвердит заказ, статус
              обновится автоматически.
            </p>
          )}
          {order.plant && (
            <p className="mt-2 text-sm text-navy-500">
              Завод подтвердил заказ и готовит доставку. Данные завода не разглашаются — если возникнут
              вопросы, свяжитесь с нами: <a href={company.phoneHref} className="font-medium text-navy-700 underline">{company.phone}</a>.
            </p>
          )}

          <div className="mt-5 space-y-2 border-t border-surface-border pt-4">
            <Row label="Материал" value={MATERIAL_LABELS[order.materialType]} />
            {order.concreteGrade && <Row label="Марка" value={order.concreteGrade} />}
            <Row label="Количество" value={`${order.quantity} м³`} />
            <Row
              label="Бетононасос"
              value={
                order.pumpRequired
                  ? `${PUMP_TYPE_LABELS[order.pumpType ?? 'AUTO']}${order.pumpLength ? ' ' + order.pumpLength : ''}`
                  : 'Не требуется'
              }
            />
            <Row label="Адрес" value={order.addressText} />
            <Row
              label="Дата и время"
              value={`${new Date(order.deliveryDate).toLocaleDateString('ru-RU')}, ${order.deliveryTimeFrom}–${order.deliveryTimeTo}`}
            />
            {order.comment && <Row label="Комментарий" value={order.comment} />}
          </div>
        </div>

        <div className="card mt-4">
          <h2 className="mb-3 font-semibold text-navy-800">История статуса</h2>
          <ul className="space-y-2">
            {order.statusHistory.map((h) => (
              <li key={h.id} className="flex justify-between text-sm">
                <span className="text-navy-600">
                  {ORDER_STATUS_LABELS[h.status]?.label ?? h.status}
                  {h.note ? ` — ${h.note}` : ''}
                </span>
                <span className="text-navy-400">{new Date(h.createdAt).toLocaleString('ru-RU')}</span>
              </li>
            ))}
          </ul>
        </div>

        {!['DELIVERED', 'CANCELLED'].includes(order.status) && <OrderStatusPoller />}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-navy-400">{label}</span>
      <span className="text-right text-sm font-medium text-navy-800">{value}</span>
    </div>
  );
}
