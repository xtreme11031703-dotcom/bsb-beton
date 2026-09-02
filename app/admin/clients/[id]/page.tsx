import { notFound } from 'next/navigation';
import { getClient } from '@/app/actions/admin';
import { ClientForm } from '@/components/admin/ClientForm';

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">{client.name}</h1>
      <ClientForm client={{ id: client.id, name: client.name, email: client.email, phone: client.phone }} />
    </div>
  );
}
