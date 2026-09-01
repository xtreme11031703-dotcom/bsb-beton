import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlantForm } from '@/components/admin/PlantForm';

export default async function EditPlantPage({ params }: { params: { id: string } }) {
  const plant = await prisma.plant.findUnique({ where: { id: params.id } });
  if (!plant) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">{plant.name}</h1>
      <PlantForm plant={{ ...plant, materials: plant.materials as string[] }} />
    </div>
  );
}
