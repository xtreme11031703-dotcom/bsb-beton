import { listAllClients } from '@/app/actions/admin';

export default async function AdminClientsPage() {
  const clients = await listAllClients();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Клиенты</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-muted text-navy-500">
            <tr>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Заказов</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-surface-border last:border-0">
                <td className="px-4 py-3 font-medium text-navy-800">{c.name}</td>
                <td className="px-4 py-3 text-navy-600">{c.email}</td>
                <td className="px-4 py-3 text-navy-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-navy-600">{c._count.ordersAsClient}</td>
                <td className="px-4 py-3 text-navy-600">
                  {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
