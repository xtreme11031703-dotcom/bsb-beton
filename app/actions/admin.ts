'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendTelegramMessage } from '@/lib/telegram';
import { ORDER_STATUS_LABELS } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@prisma/client';

/** Уведомляет клиента в Telegram об изменении статуса заказа (если бот привязан). */
async function notifyClientStatusChange(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { client: true } });
  if (!order?.client.telegramChatId) return;
  const label = ORDER_STATUS_LABELS[status];
  await sendTelegramMessage(
    order.client.telegramChatId,
    `${label.emoji} Заказ ${order.orderNumber}: ${label.label}`,
  );
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Требуются права администратора');
  return session;
}

export async function getAdminStats() {
  await requireAdmin();
  const [total, ...byStatus] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'NEW' } }),
    prisma.order.count({ where: { status: 'SEARCHING_PLANT' } }),
    prisma.order.count({ where: { status: 'PLANT_ASSIGNED' } }),
    prisma.order.count({ where: { status: 'IN_DELIVERY' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
  ]);
  const [newC, searching, assigned, delivery, delivered, cancelled] = byStatus;
  return { total, newC, searching, assigned, delivery, delivered, cancelled };
}

export async function listAllOrders(filters?: {
  status?: OrderStatus;
  materialType?: string;
  plantId?: string;
}) {
  await requireAdmin();
  return prisma.order.findMany({
    where: {
      status: filters?.status,
      materialType: filters?.materialType as never,
      plantId: filters?.plantId,
    },
    include: { client: true, plant: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listAllPlants() {
  await requireAdmin();
  return prisma.plant.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function listAllClients() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: { _count: { select: { ordersAsClient: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

const plantSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  phone: z.string().min(5),
  radiusKm: z.coerce.number().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  materials: z.array(z.string()).min(1),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertPlant(plantId: string | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const materials = formData.getAll('materials') as string[];
  const parsed = plantSchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    phone: formData.get('phone'),
    radiusKm: formData.get('radiusKm'),
    status: formData.get('status'),
    materials,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const data = { ...parsed.data, materials: parsed.data.materials as never };

  if (plantId) {
    await prisma.plant.update({ where: { id: plantId }, data });
  } else {
    await prisma.plant.create({ data });
  }
  revalidatePath('/admin/plants');
  return { ok: true };
}

export async function deactivatePlant(plantId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.plant.update({ where: { id: plantId }, data: { status: 'INACTIVE' } });
  revalidatePath('/admin/plants');
  return { ok: true };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
    prisma.orderPlant.updateMany({
      where: { orderId, status: 'AVAILABLE' },
      data: { status: 'EXPIRED' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId, status: 'CANCELLED', changedByUserId: session.userId, note: 'Отменено администратором' },
    }),
  ]);
  revalidatePath('/admin/orders');
  await notifyClientStatusChange(orderId, 'CANCELLED');
  return { ok: true };
}

export async function changeOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderStatusHistory.create({
      data: { orderId, status, changedByUserId: session.userId, note: 'Статус изменён администратором' },
    }),
  ]);
  revalidatePath('/admin/orders');
  await notifyClientStatusChange(orderId, status);
  return { ok: true };
}

// ---- Живой чат с сайта ----

export async function getUnreadChatCount(): Promise<number> {
  await requireAdmin();
  return prisma.chatThread.count({ where: { adminUnread: true } });
}

export async function listChatThreads() {
  await requireAdmin();
  return prisma.chatThread.findMany({
    orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }],
    include: {
      client: { select: { name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
}

export async function getChatThread(threadId: string) {
  await requireAdmin();
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: {
      client: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (thread?.adminUnread) {
    await prisma.chatThread.update({ where: { id: threadId }, data: { adminUnread: false } });
  }
  return thread;
}

export async function sendAdminReply(threadId: string, text: string): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Пустое сообщение' };

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { threadId, sender: 'ADMIN', text: trimmed } }),
    prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date(), visitorUnread: true, adminUnread: false },
    }),
  ]);
  revalidatePath(`/admin/chats/${threadId}`);
  revalidatePath('/admin/chats');
  return { ok: true };
}

export async function setChatThreadStatus(threadId: string, status: 'OPEN' | 'CLOSED'): Promise<ActionResult> {
  await requireAdmin();
  await prisma.chatThread.update({ where: { id: threadId }, data: { status } });
  revalidatePath('/admin/chats');
  revalidatePath(`/admin/chats/${threadId}`);
  return { ok: true };
}

export async function assignOrderManually(orderId: string, plantId: string): Promise<ActionResult> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: 'Заказ не найден' };
  if (order.plantId) return { ok: false, error: 'Заказ уже назначен заводу' };

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { plantId, status: 'PLANT_ASSIGNED', acceptedAt: new Date() },
    }),
    prisma.orderPlant.upsert({
      where: { orderId_plantId: { orderId, plantId } },
      create: { orderId, plantId, status: 'TAKEN', respondedAt: new Date() },
      update: { status: 'TAKEN', respondedAt: new Date() },
    }),
    prisma.orderPlant.updateMany({
      where: { orderId, plantId: { not: plantId }, status: 'AVAILABLE' },
      data: { status: 'EXPIRED' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId, status: 'PLANT_ASSIGNED', note: 'Назначено вручную администратором' },
    }),
  ]);
  revalidatePath('/admin/orders');
  await notifyClientStatusChange(orderId, 'PLANT_ASSIGNED');
  return { ok: true };
}
