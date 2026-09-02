'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { generateOrderNumber, distanceKm } from '@/lib/utils';
import { distinctCategories, getItemLineTotal, getItemUnitPrice, plantCoversCategories, summarizeOrderItems } from '@/lib/catalog';
import { getPriceTable } from '@/lib/get-price-table';
import { sendTelegramMessageToMany, siteUrl } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';

const CATEGORIES = ['BETON', 'TOSHCHIY_BETON', 'VYSOKOPROCHNYY_BETON', 'POLISTIROLBETON', 'RASTVORY', 'NASOS'] as const;
// Полный набор марок по всем категориям каталога сразу — см. lib/catalog.ts,
// какие конкретно марки доступны для какого сочетания категория/наполнитель/
// вид раствора (это уже не проверка формата, а бизнес-правило, поэтому здесь
// достаточно проверить, что значение вообще существует как марка).
const GRADES = [
  'M50', 'M75', 'M100', 'M150', 'M200', 'M250', 'M300', 'M350', 'M400', 'M450', 'M500',
  'M550', 'M600', 'M700', 'M800', 'M900', 'M1000',
] as const;

const itemSchema = z.object({
  category: z.enum(CATEGORIES),
  concreteGrade: z.enum(GRADES).optional(),
  aggregate: z.enum(['GRAVEL', 'GRANITE', 'EXPANDED_CLAY']).optional(),
  concreteClass: z.string().optional(),
  mobility: z.string().optional(),
  frostResistance: z.string().optional(),
  waterResistance: z.string().optional(),
  hasFiber: z.coerce.boolean().optional(),
  mortarKind: z.enum(['CEMENT', 'SPECIAL', 'SAND_CONCRETE']).optional(),
  pumpType: z.enum(['AUTO', 'STATIONARY']).optional(),
  pumpLength: z.string().optional(),
  pumpNote: z.string().optional(),
  quantity: z.coerce.number().min(0).default(0),
  additionalWishes: z.string().optional(),
});

const orderSchema = z.object({
  items: z.array(itemSchema).min(1, 'Добавьте хотя бы одну позицию в корзину'),
  addressText: z.string().min(3, 'Укажите адрес'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  deliveryDate: z.string().min(1, 'Укажите дату'),
  deliveryTimeFrom: z.string().min(1),
  deliveryTimeTo: z.string().min(1),
  contactName: z.string().min(2, 'Укажите имя'),
  contactPhone: z.string().min(5, 'Укажите телефон'),
  comment: z.string().optional(),
  // Заполняются только если пользователь ещё не вошёл в систему —
  // позволяет оформить заказ без отдельного шага регистрации.
  guestEmail: z.string().email().optional().or(z.literal('')),
  guestPassword: z.string().optional(),
});

export type ActionResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: string };

export async function submitOrder(input: unknown): Promise<ActionResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  let session = await getSession();

  // Гостевое оформление: авторизуем существующего клиента по email/паролю
  // либо создаём новый аккаунт клиента, используя контактные данные заказа.
  if (!session) {
    if (!data.guestEmail || !data.guestPassword) {
      return { ok: false, error: 'Укажите email и пароль, чтобы подтвердить заказ' };
    }
    const existingUser = await prisma.user.findUnique({ where: { email: data.guestEmail } });
    if (existingUser) {
      if (existingUser.role !== 'CLIENT') {
        return { ok: false, error: 'Этот email уже используется другой ролью' };
      }
      const valid = await verifyPassword(data.guestPassword, existingUser.passwordHash);
      if (!valid) return { ok: false, error: 'Неверный пароль для этого email' };
      session = { userId: existingUser.id, role: 'CLIENT', plantId: null, name: existingUser.name };
    } else {
      if (data.guestPassword.length < 6) {
        return { ok: false, error: 'Пароль должен быть не короче 6 символов' };
      }
      const passwordHash = await hashPassword(data.guestPassword);
      const newUser = await prisma.user.create({
        data: {
          name: data.contactName,
          phone: data.contactPhone,
          email: data.guestEmail,
          passwordHash,
          role: 'CLIENT',
        },
      });
      session = { userId: newUser.id, role: 'CLIENT', plantId: null, name: newUser.name };
    }
    await createSession(session);
  }

  if (session.role !== 'CLIENT') {
    return { ok: false, error: 'Заказы может оформлять только клиент' };
  }

  // Ищем подходящие активные заводы: завод должен уметь ВСЕ категории из
  // корзины (см. plantCoversCategories) + доставка должна укладываться в
  // радиус работы завода. Заказ целиком уходит одному заводу — разбивки
  // разных позиций по разным заводам в MVP нет.
  const neededCategories = distinctCategories(data.items);
  const candidatePlants = await prisma.plant.findMany({ where: { status: 'ACTIVE' } });

  const matchingPlants = candidatePlants
    .filter((plant) => plantCoversCategories(plant.categories, neededCategories))
    .map((plant) => ({
      plant,
      distance: distanceKm(data.latitude, data.longitude, plant.latitude, plant.longitude),
    }))
    .filter(({ plant, distance }) => distance <= plant.radiusKm)
    .sort((a, b) => a.distance - b.distance);

  const orderNumber = await generateOrderNumber();
  // Живые цены из /admin/prices — читаем их здесь же, на сервере, вместе с
  // остальными данными заказа (см. комментарий ниже про unitPrice/lineTotal).
  const priceTable = await getPriceTable();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId: session.userId,
      items: {
        // Цена считается ЗДЕСЬ, на сервере, по актуальному прайсу
        // (CatalogPrice из /admin/prices, с запасным вариантом из
        // lib/catalog.ts) — а не принимается от клиента (иначе её можно было
        // бы подделать в запросе). unitPrice/lineTotal сохраняются как
        // снимок на момент оформления, см. комментарий у этих полей в
        // prisma/schema.prisma — цена изменится в админке позже, а уже
        // оформленный заказ должен остаться с той ценой, что была при заказе.
        create: data.items.map((item) => ({
          category: item.category,
          concreteGrade: item.concreteGrade,
          aggregate: item.aggregate,
          concreteClass: item.concreteClass || null,
          mobility: item.mobility || null,
          frostResistance: item.frostResistance || null,
          waterResistance: item.waterResistance || null,
          hasFiber: item.hasFiber ?? false,
          mortarKind: item.mortarKind,
          pumpType: item.pumpType,
          pumpLength: item.pumpLength || null,
          pumpNote: item.pumpNote || null,
          quantity: item.quantity ?? 0,
          additionalWishes: item.additionalWishes || null,
          unitPrice: getItemUnitPrice(item, priceTable),
          lineTotal: getItemLineTotal(item, priceTable),
        })),
      },
      addressText: data.addressText,
      latitude: data.latitude,
      longitude: data.longitude,
      deliveryDate: new Date(data.deliveryDate),
      deliveryTimeFrom: data.deliveryTimeFrom,
      deliveryTimeTo: data.deliveryTimeTo,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      comment: data.comment || null,
      status: matchingPlants.length > 0 ? 'SEARCHING_PLANT' : 'NEW',
      statusHistory: {
        create: {
          status: matchingPlants.length > 0 ? 'SEARCHING_PLANT' : 'NEW',
          changedByUserId: session.userId,
          note: 'Заказ создан клиентом',
        },
      },
      orderPlants: {
        create: matchingPlants.map(({ plant, distance }) => ({
          plantId: plant.id,
          distanceKm: distance,
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath('/client/orders');
  await notifyNewOrder(order.id, orderNumber, order.items, matchingPlants.map((m) => m.plant.id));
  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}

/** Уведомляет в Telegram заводы, которым доступен новый заказ, и админов. */
async function notifyNewOrder(
  orderId: string,
  orderNumber: string,
  items: Parameters<typeof summarizeOrderItems>[0],
  matchingPlantIds: string[],
) {
  const summary = summarizeOrderItems(items);

  const [plantUsers, adminUsers] = await Promise.all([
    matchingPlantIds.length > 0
      ? prisma.user.findMany({
          where: { role: 'PLANT', plantId: { in: matchingPlantIds }, telegramChatId: { not: null } },
          select: { telegramChatId: true },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: { role: 'ADMIN', telegramChatId: { not: null } },
      select: { telegramChatId: true },
    }),
  ]);

  const plantChatIds = plantUsers.map((u: { telegramChatId: string | null }) => u.telegramChatId!).filter(Boolean);
  if (plantChatIds.length > 0) {
    await sendTelegramMessageToMany(
      plantChatIds,
      `🆕 Новый заказ ${orderNumber}\n${summary}\n\nПосмотреть и взять: ${siteUrl('/plant')}`,
    );
  }

  const adminChatIds = adminUsers.map((u: { telegramChatId: string | null }) => u.telegramChatId!).filter(Boolean);
  if (adminChatIds.length > 0) {
    const adminText =
      matchingPlantIds.length > 0
        ? `🆕 Новый заказ ${orderNumber}\n${summary}\nДоступен ${matchingPlantIds.length} завод(ам).`
        : `⚠️ Заказ ${orderNumber} без подходящего завода\n${summary}\n\nНи один завод не подошёл автоматически (категория товара/радиус доставки) — нужно назначить вручную: ${siteUrl('/admin/orders')}`;

    await sendTelegramMessageToMany(adminChatIds, adminText);
  }
}

export async function getClientOrders() {
  const session = await getSession();
  if (!session || session.role !== 'CLIENT') return [];
  return prisma.order.findMany({
    where: { clientId: session.userId },
    include: { plant: true, items: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClientOrderById(orderId: string) {
  const session = await getSession();
  if (!session || session.role !== 'CLIENT') return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.userId },
    include: { plant: true, items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
  });
  return order;
}
