import { PlantForm } from '@/components/admin/PlantForm';

export default function NewPlantPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Новый завод</h1>
      <PlantForm plant={null} />
    </div>
  );
}
