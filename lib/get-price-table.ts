// Серверный хелпer, отдельный от lib/catalog.ts специально: lib/catalog.ts
// импортируется и клиентскими компонентами (OrderWizard, CatalogCategoryGrid),
// поэтому там не может быть прямого импорта '@/lib/prisma' (это server-only,
// тянет Node-драйвер БД в клиентский бандл). Этот файл импортируют только
// серверные компоненты и server actions.
import { prisma } from '@/lib/prisma';
import type { PriceTable } from '@/lib/catalog';

/** Текущие цены из админки (/admin/prices) в виде { priceEntryId: цена }.
 * Строк может не быть вообще (сид ещё не запускали) — тогда возвращается
 * пустой объект, и getItemUnitPrice/getItemLineTotal просто используют
 * значения по умолчанию, зашитые в lib/catalog.ts. */
export async function getPriceTable(): Promise<PriceTable> {
  const rows = await prisma.catalogPrice.findMany({ select: { id: true, price: true } });
  const table: PriceTable = {};
  for (const row of rows) {
    table[row.id] = row.price;
  }
  return table;
}
