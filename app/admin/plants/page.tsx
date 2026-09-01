import Link from 'next/link';
import { listAllPlants } from '@/app/actions/admin';
import { MATERIAL_LABELS } from '@/lib/utils';

export default async function AdminPlantsPage() {
  const plants = await listAllPlants();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">Заводы</h1>
        <Link href="/admin/plants/new" className="btn-primary !px-4 !py-2.5 text-sm">
          Добавить завод
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <Link key={plant.id} href={`/admin/plants/${plant.id}`} className="card block hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-navy-800">{plant.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  plant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {plant.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <p className="mt-1 text-sm text-navy-500">{plant.address}</p>
            <p className="mt-1 text-sm text-navy-400">Радиус: {plant.radiusKm} км</p>
            <p className="mt-1 text-sm text-navy-400">
              {plant.materials.map((m) => MATERIAL_LABELS[m]).join(', ')}
            </p>
            <p className="mt-1 text-sm text-navy-400">Заказов: {plant._count.orders}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
