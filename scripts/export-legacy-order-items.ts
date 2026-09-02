// Шаг 1 из 2 миграции старых заказов в новую корзину (OrderItem). ВАЖНО:
// запускать ДО `npx prisma db push` этого патча — как только вы примените
// новую prisma/schema.prisma через db push, старые колонки Order
// (materialType, concreteGrade, quantity, pumpRequired и т.д.) будут удалены
// из базы вместе с данными, которые в них хранились у уже существующих
// заказов. Этот скрипт сохраняет их в JSON-файл, пока они ещё есть в базе.
//
// Использует "сырой" SQL (а не обычный prisma.order.findMany), чтобы не
// зависеть от того, какая версия Prisma Client сейчас сгенерирована — он
// читает колонки по именам напрямую из таблицы "Order".
//
// Порядок применения патча целиком:
//   1) git am (применить патч с кодом)
//   2) npx tsx scripts/export-legacy-order-items.ts     — этот скрипт
//   3) npx prisma db push                                — применить новую схему
//   4) npx tsx scripts/import-legacy-order-items.ts       — восстановить позиции
//
// Если заказов в базе ещё не было (свежая база) — можно смело пропустить
// оба скрипта и сразу перейти к `npx prisma db push`.

import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const OUT_PATH = path.join(__dirname, '..', 'legacy-order-items-backup.json');

async function main() {
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT id, "materialType", "concreteGrade", quantity, "concreteClass", mobility,
           "frostResistance", "waterResistance", "hasFiber", "additionalWishes",
           "pumpRequired", "pumpType", "pumpLength", "pumpNote"
    FROM "Order"
  `)) as unknown[];

  fs.writeFileSync(OUT_PATH, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`Экспортировано заказов: ${rows.length} → ${OUT_PATH}`);
  console.log('\nДальше:');
  console.log('  npx prisma db push');
  console.log('  npx tsx scripts/import-legacy-order-items.ts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
