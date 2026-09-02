'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/session';
import { generateLinkCode } from '@/lib/telegram';
import { validateTelegramInitData } from '@/lib/telegram-auth';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

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

export type MiniAppAuthResult =
  | { ok: true; role: Role }
  | { ok: false; error: string };

/**
 * Авторизация в Telegram Mini App: проверяет initData (подпись HMAC от Telegram,
 * см. lib/telegram-auth.ts), затем находит пользователя по telegramChatId
 * (тому же полю, что использует и обычная привязка через /link в боте — оба
 * способа линкуют один и тот же аккаунт) либо создаёт нового клиента, и
 * открывает обычную сессию сайта. Дальше человек попадает в те же страницы
 * (/order/new, /client/orders и т.д.), что и на сайте — интерфейс переиспользуется.
 */
export async function authenticateMiniApp(initData: string): Promise<MiniAppAuthResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { ok: false, error: 'Бот не настроен на сервере' };

  const result = validateTelegramInitData(initData, botToken);
  if (!result.ok) return { ok: false, error: result.error };

  const telegramChatId = String(result.user.id);

  let user = await prisma.user.findUnique({ where: { telegramChatId } });

  if (!user) {
    const displayName = [result.user.first_name, result.user.last_name].filter(Boolean).join(' ') || 'Клиент Telegram';
    const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
    user = await prisma.user.create({
      data: {
        // Синтетический email — вход через сайт этим пользователям не нужен,
        // у них авторизация только через Telegram Mini App.
        email: `tg${telegramChatId}@telegram.local`,
        passwordHash,
        name: displayName,
        role: 'CLIENT',
        telegramChatId,
      },
    });
  }

  await createSession({
    userId: user.id,
    role: user.role,
    plantId: user.plantId,
    name: user.name,
  });

  return { ok: true, role: user.role };
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
