import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlantForm } from '@/components/admin/PlantForm';
import { PlantUsers } from '@/components/admin/PlantUsers';
import { listPlantUsers } from '@/app/actions/admin';

export default async function EditPlantPage({ params }: { params: { id: string } }) {
  const plant = await prisma.plant.findUnique({ where: { id: params.id } });
  if (!plant) notFound();

  const plantUsers = await listPlantUsers(plant.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">{plant.name}</h1>
      <PlantForm plant={{ ...plant, categories: plant.categories as string[] }} />
      <PlantUsers plantId={plant.id} users={plantUsers} />
    </div>
  );
}
