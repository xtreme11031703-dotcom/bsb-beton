import { getPriceRowsForAdmin } from '@/app/actions/catalog-prices';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/catalog';
import type { ProductCategory } from '@prisma/client';
import { PricesForm } from './PricesForm';

export const dynamic = 'force-dynamic';

export default async function AdminPricesPage() {
  const rows = await getPriceRowsForAdmin();

  const byCategory = new Map<ProductCategory, typeof rows>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  const groups = Array.from(byCategory.entries()).map(([category, items]) => ({
    category,
    label: PRODUCT_CATEGORY_LABELS[category],
    items,
  }));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">Цены</h1>
        <span className="text-sm text-navy-400">Всего позиций: {rows.length}</span>
      </div>
      <p className="mb-6 text-sm text-navy-500">
        Цена, которую видит клиент в каталоге и в мастере заказа, а также та, что сохраняется в
        новых заказах. Уже оформленные заказы не пересчитываются — там сохранён снимок цены на
        момент оформления.
      </p>

      <PricesForm groups={groups} />
    </div>
  );
}
