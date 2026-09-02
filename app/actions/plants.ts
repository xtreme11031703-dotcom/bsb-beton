'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendTelegramMessage, siteUrl } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';

/** Заказы, доступные для завода текущего пользователя (роль PLANT), сгруппированные по статусу. */
export async function getPlantOrders() {
  const session = await getSession();
  if (!session || session.role !== 'PLANT' || !session.plantId) return null;

  const [available, mine] = await Promise.all([
    prisma.orderPlant.findMany({
      where: { plantId: session.plantId, status: 'AVAILABLE', order: { status: 'SEARCHING_PLANT' } },
      include: { order: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findMany({
      where: { plantId: session.plantId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return { available, mine };
}

export type TakeOrderResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * КЛЮЧЕВАЯ ЛОГИКА: "кто первый — тот получил".
 *
 * Атомарность обеспечивается через `updateMany` с условием `status: 'SEARCHING_PLANT', plantId: null`
 * в теле WHERE. PostgreSQL берёт блокировку строки на время UPDATE, поэтому при одновременном
 * обращении нескольких заводов вторая и последующие транзакции дождутся первой, затем повторно
 * проверят условие WHERE и не найдут подходящую строку (count = 0) — заказ уже занят.
 * Так гарантируется, что назначить завод сможет только один запрос, без гонки состояний.
 */
export async function takeOrder(orderId: string): Promise<TakeOrderResult> {
  const session = await getSession();
  if (!session || session.role !== 'PLANT' || !session.plantId) {
    return { ok: false, error: 'Необходимо войти как завод' };
  }
  const plantId = session.plantId;

  const orderPlant = await prisma.orderPlant.findUnique({
    where: { orderId_plantId: { orderId, plantId } },
  });
  if (!orderPlant) {
    return { ok: false, error: 'Этот заказ недоступен вашему заводу' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: 'SEARCHING_PLANT', plantId: null },
      data: { plantId, status: 'PLANT_ASSIGNED', acceptedAt: new Date() },
    });

    if (updated.count === 0) {
      // Заказ уже забрал другой завод (или он отменён/недоступен)
      await tx.orderPlant.updateMany({
        where: { orderId, plantId, status: 'AVAILABLE' },
        data: { status: 'EXPIRED', respondedAt: new Date() },
      });
      return { taken: false };
    }

    await tx.orderPlant.update({
      where: { orderId_plantId: { orderId, plantId } },
      data: { status: 'TAKEN', respondedAt: new Date() },
    });

    // Все остальные предложения по этому заказу больше не актуальны
    await tx.orderPlant.updateMany({
      where: { orderId, plantId: { not: plantId }, status: 'AVAILABLE' },
      data: { status: 'EXPIRED', respondedAt: new Date() },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'PLANT_ASSIGNED',
        note: 'Завод принял заказ',
      },
    });

    return { taken: true };
  });

  revalidatePath('/plant');
  revalidatePath('/client/orders');
  revalidatePath('/admin/orders');

  if (!result.taken) {
    return { ok: false, error: 'Заказ уже забрал другой завод' };
  }

  await notifyClientPlantAssigned(orderId);
  return { ok: true };
}

/**
 * Уведомляет клиента в Telegram, что заводу назначен его заказ.
 *
 * Данные завода клиенту намеренно не раскрываются (и наоборот — см.
 * getPlantOrders/getPlantOrderDetail ниже, там нет client-полей в выборке
 * для интерфейса завода): по требованию заказчика стороны видят только
 * адрес и логистику, а не контакты друг друга.
 */
async function notifyClientPlantAssigned(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: true },
  });
  if (!order?.client.telegramChatId) return;

  await sendTelegramMessage(
    order.client.telegramChatId,
    `🟢 Заказ ${order.orderNumber} — завод найден!\n\nГотовим доставку по адресу: ${order.addressText}\n\nСледить за статусом: ${siteUrl(`/client/orders/${order.id}`)}`,
  );
}

// Пока нигде не используется (нет отдельной страницы деталей заказа завода).
// ВАЖНО: если будете строить такую страницу — не рендерите client.name/phone,
// заводу не должны быть видны контакты клиента (см. комментарий у
// notifyClientPlantAssigned выше).
export async function getPlantOrderDetail(orderId: string) {
  const session = await getSession();
  if (!session || session.role !== 'PLANT' || !session.plantId) return null;
  return prisma.order.findFirst({
    where: { id: orderId, plantId: session.plantId },
    include: { client: true },
  });
}
