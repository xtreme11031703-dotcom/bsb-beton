'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getAllPriceRows, type CatalogPriceRow } from '@/lib/catalog';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Требуются права администратора');
  return session;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type AdminPriceRow = CatalogPriceRow & { currentPrice: number };

/** Строки прайса для формы /admin/prices — defaultPrice из кода (см.
 * lib/catalog.ts -> getAllPriceRows) плюс currentPrice: то, что реально
 * будет применяться к новым заказам прямо сейчас (переопределение из БД,
 * если оно уже сохранено, иначе то же значение по умолчанию). */
export async function getPriceRowsForAdmin(): Promise<AdminPriceRow[]> {
  await requireAdmin();
  const rows = getAllPriceRows();
  const overrides = await prisma.catalogPrice.findMany({ select: { id: true, price: true } });
  const overrideMap = new Map<string, number>(overrides.map((o): [string, number] => [o.id, o.price]));
  return rows.map((row) => ({ ...row, currentPrice: overrideMap.get(row.id) ?? row.defaultPrice }));
}

/** Одна форма, одна кнопка "Сохранить все цены" — присылает поле
 * `price:<id>` на каждую строку прайса, тут одним проходом апсертим все. Сначала
 * проверяем ВСЕ значения и только потом сохраняем — чтобы одна опечатка в
 * одном поле не привела к сохранению остальных, но потере именно этой цены
 * без объяснения, откуда взялась половинчатая правка. */
export async function updateCatalogPrices(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const rows = getAllPriceRows();
  const updates: { row: CatalogPriceRow; price: number }[] = [];

  for (const row of rows) {
    const raw = formData.get(`price:${row.id}`);
    if (raw === null) continue;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: `Некорректная цена для «${row.label}»` };
    }
    updates.push({ row, price });
  }

  await prisma.$transaction(
    updates.map(({ row, price }) =>
      prisma.catalogPrice.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          category: row.category,
          aggregate: row.aggregate ?? null,
          mortarKind: row.mortarKind ?? null,
          grade: row.grade ?? null,
          pumpType: row.pumpType ?? null,
          pumpLength: row.pumpLength ?? null,
          price,
        },
        update: { price },
      }),
    ),
  );

  // Каталог и мастер заказа читают цены при каждом заходе (force-dynamic),
  // но revalidatePath всё равно нужен — сбрасывает Next.js Full Route Cache
  // для этих путей, чтобы новая цена не залипла в кеше до следующего деплоя.
  revalidatePath('/admin/prices');
  revalidatePath('/catalog', 'layout');
  revalidatePath('/order/new');
  return { ok: true };
}
