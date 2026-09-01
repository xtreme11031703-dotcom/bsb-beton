import { listAllPlants } from '@/app/actions/admin';
import YandexMap from '@/components/YandexMap';

export default async function AdminMapPage() {
  const plants = await listAllPlants();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-navy-800">
        Карта заводов
      </h1>

      <p className="mb-6 text-sm text-navy-500">
        Расположение заводов Москвы и МО.
      </p>

      <div className="card overflow-hidden">
        <YandexMap plants={plants} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {plants.map((plant) => (
          <div key={plant.id} className="card">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-navy-800">
                {plant.name}
              </span>

              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  plant.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {plant.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
              </span>
            </div>

            <p className="mt-1 text-sm text-navy-500">
              {plant.address}
            </p>

            <p className="mt-1 text-sm text-navy-400">
              Радиус: {plant.radiusKm} км · Заказов: {plant._count.orders}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
