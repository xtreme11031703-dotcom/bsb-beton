// Шаг 2 из 2 миграции старых заказов в новую корзину (OrderItem). Запускать
// ПОСЛЕ `npx prisma db push` (когда таблица OrderItem уже существует), читает
// файл, который создал scripts/export-legacy-order-items.ts, и превращает
// старые плоские поля заказа (один materialType на заказ + необязательный
// насос-добавка) в позиции корзины.
//
// Важный нюанс: раньше насос был ДОБАВКОЙ к любому заказу (pumpRequired:
// true рядом с, например, materialType: CONCRETE), а не отдельной позицией.
// Теперь аренда насоса — своя категория NASOS. Поэтому заказ, где был и
// материал, и насос, превращается в ДВЕ позиции OrderItem — так же, как если
// бы этот заказ оформляли в новом мастере.
//
// Старый MaterialType не совпадает 1:1 с новыми категориями каталога — в
// каталоге bsb-beton.ru никогда не было отдельных пунктов "песок"/"щебень"/
// "цемент" (это были только тестовые значения из prisma/seed.ts, не реальные
// товары). Бетон и раствор переносятся в свою категорию корректно; для
// песка/щебня/цемента/другого категория проставляется как "Товарный бетон"
// (ближайший по смыслу пункт для строительного объекта), а исходное
// название материала сохраняется в комментарии к позиции, чтобы информация
// не потерялась молча.
//
// Идемпотентен: заказ, для которого уже создана хоть одна OrderItem,
// пропускается — можно запускать повторно без риска задвоить позиции.

import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient, type ProductCategory } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const IN_PATH = path.join(__dirname, '..', 'legacy-order-items-backup.json');

const CATEGORY_MAP: Record<string, ProductCategory | null> = {
  CONCRETE: 'BETON',
  MORTAR: 'RASTVORY',
  SAND: null,
  GRAVEL: null,
  CEMENT: null,
  OTHER: null,
};

const LEGACY_MATERIAL_LABELS: Record<string, string> = {
  CONCRETE: 'Бетон',
  SAND: 'Песок',
  GRAVEL: 'Щебень',
  CEMENT: 'Цемент',
  MORTAR: 'Раствор',
  OTHER: 'Другое',
};

type LegacyRow = {
  id: string;
  materialType: string;
  concreteGrade: string | null;
  quantity: number;
  concreteClass: string | null;
  mobility: string | null;
  frostResistance: string | null;
  waterResistance: string | null;
  hasFiber: boolean;
  additionalWishes: string | null;
  pumpRequired: boolean;
  pumpType: string | null;
  pumpLength: string | null;
  pumpNote: string | null;
};

async function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`Файл ${IN_PATH} не найден.`);
    console.error('Сначала (ДО db push) запустите: npx tsx scripts/export-legacy-order-items.ts');
    process.exitCode = 1;
    return;
  }

  const rows: LegacyRow[] = JSON.parse(fs.readFileSync(IN_PATH, 'utf-8'));

  const alreadyMigrated = new Set(
    (await prisma.orderItem.findMany({ select: { orderId: true } })).map((i) => i.orderId),
  );

  let createdOrders = 0;
  let createdItems = 0;
  let skipped = 0;

  for (const row of rows) {
    if (alreadyMigrated.has(row.id)) {
      skipped++;
      continue;
    }

    const mappedCategory = CATEGORY_MAP[row.materialType];
    const category: ProductCategory = mappedCategory ?? 'BETON';
    const legacyNote =
      mappedCategory === null
        ? `Исходный материал (до перехода на корзину): ${LEGACY_MATERIAL_LABELS[row.materialType] ?? row.materialType}`
        : null;

    const items = [
      {
        orderId: row.id,
        category,
        concreteGrade: row.concreteGrade ?? null,
        concreteClass: row.concreteClass ?? null,
        mobility: row.mobility ?? null,
        frostResistance: row.frostResistance ?? null,
        waterResistance: row.waterResistance ?? null,
        hasFiber: row.hasFiber ?? false,
        quantity: row.quantity ?? 0,
        additionalWishes: [row.additionalWishes, legacyNote].filter(Boolean).join(' | ') || null,
      },
    ];

    // Раньше насос был добавкой к заказу — переносим отдельной позицией.
    if (row.pumpRequired) {
      items.push({
        orderId: row.id,
        category: 'NASOS' as ProductCategory,
        concreteGrade: null,
        concreteClass: null,
        mobility: null,
        frostResistance: null,
        waterResistance: null,
        hasFiber: false,
        quantity: 0,
        additionalWishes: null,
      } as (typeof items)[number]);
    }

    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          ...item,
          ...(item.category === 'NASOS'
            ? {
                pumpType: (row.pumpType as never) ?? null,
                pumpLength: row.pumpLength ?? null,
                pumpNote: row.pumpNote ?? null,
              }
            : {}),
        },
      });
      createdItems++;
    }
    createdOrders++;
  }

  console.log(`Готово: заказов обработано — ${createdOrders} (позиций создано — ${createdItems}), пропущено (уже были мигрированы) — ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
