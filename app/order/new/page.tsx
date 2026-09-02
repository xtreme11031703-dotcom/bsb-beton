import { SiteHeader } from '@/components/SiteHeader';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getPriceTable } from '@/lib/get-price-table';
import { OrderWizard } from './OrderWizard';

// Цены читаются из БД (CatalogPrice, /admin/prices) при каждом заходе — не
// кешируем страницу статически, иначе правка цены админом не долетала бы до
// клиента без пересборки сайта.
export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const session = await getSession();
  let prefillName = '';
  let prefillPhone = '';

  if (session?.role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    prefillName = user?.name ?? '';
    prefillPhone = user?.phone ?? '';
  }

  const priceTable = await getPriceTable();

  return (
    <div className="min-h-screen bg-surface-muted">
      <SiteHeader />
      <OrderWizard
        isAuthenticated={session?.role === 'CLIENT'}
        prefillName={prefillName}
        prefillPhone={prefillPhone}
        priceTable={priceTable}
      />
    </div>
  );
}
