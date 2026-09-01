'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateLinkCode } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';

export type TelegramStatus =
  | { linked: true }
  | { linked: false; code: string | null };

/** Текущий статус привязки Telegram для залогиненного пользователя. */
export async function getTelegramStatus(): Promise<TelegramStatus | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { telegramChatId: true, telegramLinkCode: true },
  });
  if (!user) return null;

  if (user.telegramChatId) return { linked: true };
  return { linked: false, code: user.telegramLinkCode };
}

/** Генерирует (или перегенерирует) код для привязки Telegram-аккаунта в боте. */
export async function generateTelegramLinkCode(): Promise<{ code: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Нужно войти в аккаунт' };

  // На случай коллизии кода — пара попыток достаточно при алфавите в 33^6 вариантов.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLinkCode();
    try {
      await prisma.user.update({
        where: { id: session.userId },
        data: { telegramLinkCode: code },
      });
      revalidatePath('/client/orders');
      revalidatePath('/plant');
      revalidatePath('/admin');
      return { code };
    } catch (err: unknown) {
      // Уникальный код уже занят — пробуем ещё раз.
      continue;
    }
  }
  return { error: 'Не удалось сгенерировать код, попробуйте ещё раз' };
}

/** Отвязать Telegram (на будущее — например, если сменился аккаунт). */
export async function unlinkTelegram(): Promise<{ ok: true }> {
  const session = await getSession();
  if (session) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { telegramChatId: null, telegramLinkCode: null },
    });
    revalidatePath('/client/orders');
    revalidatePath('/plant');
    revalidatePath('/admin');
  }
  return { ok: true };
}
