import { getAdminStats } from '@/app/actions/admin';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Всего заказов', value: stats.total },
    { label: 'Новые', value: stats.newC },
    { label: 'Ищут завод', value: stats.searching },
    { label: 'Приняты', value: stats.assigned },
    { label: 'В доставке', value: stats.delivery },
    { label: 'Завершены', value: stats.delivered },
    { label: 'Отменены', value: stats.cancelled },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-navy-400">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-navy-800">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
