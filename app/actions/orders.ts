'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { generateOrderNumber, distanceKm } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const orderSchema = z.object({
  materialType: z.enum(['CONCRETE', 'SAND', 'GRAVEL', 'CEMENT', 'MORTAR', 'OTHER']),
  concreteGrade: z
    .enum(['M100', 'M150', 'M200', 'M250', 'M300', 'M350', 'M400', 'M450', 'M500'])
    .optional(),
  quantity: z.coerce.number().min(1, 'Минимум 1 м³'),
  concreteClass: z.string().optional(),
  mobility: z.string().optional(),
  frostResistance: z.string().optional(),
  waterResistance: z.string().optional(),
  hasFiber: z.coerce.boolean().optional(),
  additionalWishes: z.string().optional(),
  pumpRequired: z.coerce.boolean(),
  pumpType: z.enum(['AUTO', 'STATIONARY']).optional(),
  pumpLength: z.string().optional(),
  pumpNote: z.string().optional(),
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

  // Ищем подходящие активные заводы: материал в списке + доставка в радиусе работы завода
  const candidatePlants = await prisma.plant.findMany({
    where: { status: 'ACTIVE', materials: { has: data.materialType } },
  });

  const matchingPlants = candidatePlants
    .map((plant) => ({
      plant,
      distance: distanceKm(data.latitude, data.longitude, plant.latitude, plant.longitude),
    }))
    .filter(({ plant, distance }) => distance <= plant.radiusKm)
    .sort((a, b) => a.distance - b.distance);

  const orderNumber = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId: session.userId,
      materialType: data.materialType,
      concreteGrade: data.concreteGrade,
      quantity: data.quantity,
      concreteClass: data.concreteClass || null,
      mobility: data.mobility || null,
      frostResistance: data.frostResistance || null,
      waterResistance: data.waterResistance || null,
      hasFiber: data.hasFiber ?? false,
      additionalWishes: data.additionalWishes || null,
      pumpRequired: data.pumpRequired,
      pumpType: data.pumpRequired ? data.pumpType : null,
      pumpLength: data.pumpRequired ? data.pumpLength : null,
      pumpNote: data.pumpRequired ? data.pumpNote : null,
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
  });

  revalidatePath('/client/orders');
  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}

export async function getClientOrders() {
  const session = await getSession();
  if (!session || session.role !== 'CLIENT') return [];
  return prisma.order.findMany({
    where: { clientId: session.userId },
    include: { plant: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClientOrderById(orderId: string) {
  const session = await getSession();
  if (!session || session.role !== 'CLIENT') return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.userId },
    include: { plant: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
  });
  return order;
}
