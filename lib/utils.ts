import { prisma } from '@/lib/prisma';

/** Генерирует следующий номер заказа вида БСБ-000123 */
export async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  const next = count + 1;
  return `БСБ-${String(next).padStart(6, '0')}`;
}

/** Расстояние между двумя точками в км (формула гаверсинуса) */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export type StatusTone = 'slate' | 'amber' | 'green' | 'blue' | 'gray';

export const ORDER_STATUS_LABELS: Record<string, { label: string; emoji: string; tone: StatusTone }> = {
  NEW: { label: 'Новый', emoji: '⚪', tone: 'slate' },
  SEARCHING_PLANT: { label: 'Ищем завод', emoji: '🟡', tone: 'amber' },
  PLANT_ASSIGNED: { label: 'Завод найден', emoji: '🟢', tone: 'green' },
  CONFIRMED: { label: 'Подтверждён', emoji: '🟢', tone: 'green' },
  IN_DELIVERY: { label: 'В доставке', emoji: '🔵', tone: 'blue' },
  DELIVERED: { label: 'Завершён', emoji: '✅', tone: 'green' },
  CANCELLED: { label: 'Отменён', emoji: '⚫', tone: 'gray' },
};

export const MATERIAL_LABELS: Record<string, string> = {
  CONCRETE: 'Бетон',
  SAND: 'Песок',
  GRAVEL: 'Щебень',
  CEMENT: 'Цемент',
  MORTAR: 'Раствор',
  OTHER: 'Другое',
};

export const PUMP_TYPE_LABELS: Record<string, string> = {
  AUTO: 'Автобетононасос',
  STATIONARY: 'Стационарный насос',
};
