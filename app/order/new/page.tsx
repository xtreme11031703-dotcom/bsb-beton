import { SiteHeader } from '@/components/SiteHeader';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OrderWizard } from './OrderWizard';

export default async function NewOrderPage() {
  const session = await getSession();
  let prefillName = '';
  let prefillPhone = '';

  if (session?.role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    prefillName = user?.name ?? '';
    prefillPhone = user?.phone ?? '';
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <OrderWizard
        isAuthenticated={session?.role === 'CLIENT'}
        prefillName={prefillName}
        prefillPhone={prefillPhone}
      />
    </div>
  );
}
