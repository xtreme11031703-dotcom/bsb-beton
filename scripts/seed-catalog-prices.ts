// Заводит в таблицу CatalogPrice запись на каждую позицию прайса — с ценой
// по умолчанию из lib/catalog.ts (тем же значением, что раньше было зашито
// прямо в коде). Нужно запустить ОДИН РАЗ после `prisma db push`, когда
// таблица CatalogPrice уже создана — до этого момента /admin/prices
// показывает те же значения по умолчанию (см. getAllPriceRows), просто ещё
// не сохранённые как переопределяемая запись в базе.
//
// Идемпотентен: если строка с таким id уже существует (например, админ уже
// поменял цену), она НЕ трогается — иначе повторный запуск скрипта случайно
// затирал бы ручные правки цены обратно на значение по умолчанию.
import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';
import { getAllPriceRows } from '../lib/catalog';

const prisma = new PrismaClient();

async function main() {
  const rows = getAllPriceRows();
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await prisma.catalogPrice.findUnique({ where: { id: row.id } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.catalogPrice.create({
      data: {
        id: row.id,
        category: row.category,
        aggregate: row.aggregate ?? null,
        mortarKind: row.mortarKind ?? null,
        grade: row.grade ?? null,
        pumpType: row.pumpType ?? null,
        pumpLength: row.pumpLength ?? null,
        price: row.defaultPrice,
      },
    });
    created++;
  }

  console.log(`Готово: создано новых строк прайса — ${created}, уже существовало (пропущено) — ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
