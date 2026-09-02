'use server';

import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateLinkCode, sendTelegramMessageToMany, siteUrl } from '@/lib/telegram';
import { chatDisplayName } from '@/lib/chat';
import { matchFaq, FAQ_GREETING, QUICK_TOPICS } from '@/lib/faq-bot';
import { revalidatePath } from 'next/cache';

// Живой чат-виджет на сайте — доступен и гостям, и залогиненным. Личность
// посетителя привязана к анонимной cookie (VISITOR_COOKIE), а не к аккаунту:
// так диалог продолжается, даже если человек не вошёл в аккаунт.
const VISITOR_COOKIE = 'bsb_chat_visitor';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 180; // 180 дней
const MAX_MESSAGE_LENGTH = 2000;

export type ChatMessageDTO = {
  id: string;
  sender: 'VISITOR' | 'ADMIN' | 'BOT';
  text: string;
  createdAt: string;
};

export type ChatThreadDTO = {
  threadId: string;
  messages: ChatMessageDTO[];
  hasUnreadReply: boolean;
};

type RawMessage = { id: string; sender: string; text: string; createdAt: Date };

function toMessageDTOs(messages: RawMessage[]): ChatMessageDTO[] {
  return messages.map((m) => ({
    id: m.id,
    sender: m.sender === 'ADMIN' || m.sender === 'BOT' ? (m.sender as 'ADMIN' | 'BOT') : 'VISITOR',
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  }));
}

async function uniqueShortCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateLinkCode();
    const exists = await prisma.chatThread.findUnique({ where: { shortCode: code } });
    if (!exists) return code;
  }
  // Практически недостижимо при 6-символьном алфавите из ~33 знаков, но на
  // всякий случай не зацикливаемся бесконечно.
  return `${generateLinkCode()}${Date.now().toString(36).slice(-2)}`;
}

/** Возвращает тред текущего посетителя (создавая при необходимости) — вызывается
 * виджетом чата при открытии страницы. Работает и для гостей, и для клиентов. */
export async function getOrCreateThread(): Promise<ChatThreadDTO> {
  const session = await getSession();
  const store = cookies();
  const existingKey = store.get(VISITOR_COOKIE)?.value;

  let thread = existingKey
    ? await prisma.chatThread.findUnique({
        where: { visitorKey: existingKey },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  if (!thread) {
    const visitorKey = existingKey || randomUUID();
    thread = await prisma.chatThread.create({
      data: {
        visitorKey,
        shortCode: await uniqueShortCode(),
        // Привязываем к аккаунту, только если это реальный клиент — сотрудник
        // завода или админ, зашедший на публичный сайт под своей учёткой, не
        // должен становиться "личностью" анонимного посетителя чата.
        clientId: session?.role === 'CLIENT' ? session.userId : null,
        // Бот сразу здоровается новым сообщением (см. FAQ_GREETING) — это НЕ
        // повод дёргать админа уведомлением "непрочитано", посетитель ещё
        // ничего не спросил, поэтому adminUnread явно false (по умолчанию у
        // модели — true, это про непрочитанный вопрос от человека).
        adminUnread: false,
        messages: { create: { sender: 'BOT', text: FAQ_GREETING } },
      },
      include: { messages: true },
    });
    store.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: VISITOR_MAX_AGE,
    });
  } else if (!thread.clientId && session?.role === 'CLIENT') {
    // Посетитель писал анонимно, потом вошёл в аккаунт клиента — подтягиваем
    // его данные к уже существующему диалогу вместо второго безымянного треда.
    thread = await prisma.chatThread.update({
      where: { id: thread.id },
      data: { clientId: session.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  return {
    threadId: thread.id,
    messages: toMessageDTOs(thread.messages),
    hasUnreadReply: thread.visitorUnread,
  };
}

/** Опрос состояния треда виджетом — тоже проверяет владение по cookie, чтобы
 * подставленный чужой threadId ничего не вернул. */
export async function pollThread(threadId: string): Promise<ChatThreadDTO | null> {
  const visitorKey = cookies().get(VISITOR_COOKIE)?.value;
  if (!visitorKey) return null;

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread || thread.visitorKey !== visitorKey) return null;

  return {
    threadId: thread.id,
    messages: toMessageDTOs(thread.messages),
    hasUnreadReply: thread.visitorUnread,
  };
}

/** Посетитель открыл окно чата и увидел ответ — сбрасываем "непрочитано". */
export async function markThreadReadByVisitor(threadId: string): Promise<void> {
  const visitorKey = cookies().get(VISITOR_COOKIE)?.value;
  if (!visitorKey) return;
  await prisma.chatThread.updateMany({
    where: { id: threadId, visitorKey },
    data: { visitorUnread: false },
  });
}

export type SendMessageResult = { ok: true } | { ok: false; error: string };

/** Посетитель отправляет сообщение в свой тред и мы алертим админов в Telegram. */
export async function sendVisitorMessage(threadId: string, text: string): Promise<SendMessageResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Пустое сообщение' };
  if (trimmed.length > MAX_MESSAGE_LENGTH) return { ok: false, error: 'Слишком длинное сообщение' };

  const visitorKey = cookies().get(VISITOR_COOKIE)?.value;
  if (!visitorKey) return { ok: false, error: 'Сессия чата не найдена, обновите страницу' };

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { client: { select: { name: true } } },
  });
  if (!thread || thread.visitorKey !== visitorKey) return { ok: false, error: 'Диалог не найден' };

  // Сохраняем сообщение посетителя ПЕРВЫМ и отдельно от попытки ответа
  // бота — это не должно быть одной транзакцией с ботом: если вдруг
  // сохранение ответа бота почему-то упадёт, сообщение посетителя всё
  // равно должно долететь и админ должен быть уведомлён, а не потеряться
  // молча вместе с ошибкой бота.
  await prisma.chatMessage.create({ data: { threadId, sender: 'VISITOR', text: trimmed } });

  // Пробуем ответить ботом по FAQ — если уверенного совпадения нет,
  // matchFaq вернёт null и дальше всё идёт как раньше (уходит человеку).
  const botAnswer = matchFaq(trimmed);
  let botAnswerSaved = false;

  if (botAnswer) {
    try {
      await prisma.chatMessage.create({ data: { threadId, sender: 'BOT', text: botAnswer } });
      botAnswerSaved = true;
    } catch (error) {
      console.error('Не удалось сохранить ответ бота (сообщение посетителя уже сохранено):', error);
    }
  }

  await prisma.chatThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: new Date(),
      status: 'OPEN',
      // Бот ответил сам — не дёргаем администратора уведомлением (админ
      // всё равно увидит диалог целиком в /admin/chats). Если посетитель
      // после ответа бота напишет ещё раз и бот не поймёт — это уже
      // обычное сообщение, adminUnread снова станет true.
      adminUnread: !botAnswerSaved,
      visitorUnread: botAnswerSaved,
    },
  });

  revalidatePath('/admin/chats');
  if (!botAnswerSaved) {
    await notifyAdminsNewChatMessage(thread.shortCode, chatDisplayName(thread), trimmed);
  }
  return { ok: true };
}

/**
 * Кнопка быстрого вопроса под приветствием бота (см. lib/faq-bot.ts ->
 * QUICK_TOPICS) — в отличие от sendVisitorMessage, ответ тут не ищется через
 * matchFaq (свободный текст мог бы не попасть в нужный корень/фразу), а
 * берётся напрямую по id топика, поэтому кнопка гарантированно отвечает
 * правильно. В тред добавляются оба сообщения — вопрос как бы "от посетителя"
 * (чтобы в истории чата и у админа в /admin/chats выглядело как обычный
 * диалог) и сразу ответ бота.
 */
export async function sendFaqQuickTopic(threadId: string, topicId: number): Promise<SendMessageResult> {
  const topic = QUICK_TOPICS.find((t) => t.id === topicId);
  if (!topic) return { ok: false, error: 'Вопрос не найден' };

  const visitorKey = cookies().get(VISITOR_COOKIE)?.value;
  if (!visitorKey) return { ok: false, error: 'Сессия чата не найдена, обновите страницу' };

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.visitorKey !== visitorKey) return { ok: false, error: 'Диалог не найден' };

  await prisma.chatMessage.create({ data: { threadId, sender: 'VISITOR', text: topic.question } });
  await prisma.chatMessage.create({ data: { threadId, sender: 'BOT', text: topic.answer } });

  await prisma.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date(), status: 'OPEN', adminUnread: false, visitorUnread: true },
  });

  revalidatePath('/admin/chats');
  return { ok: true };
}

/** Алертит админов в Telegram о новом сообщении — с кодом треда, чтобы можно
 * было ответить прямо из Telegram командой /reply КОД текст. */
async function notifyAdminsNewChatMessage(shortCode: string, who: string, text: string) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  const chatIds = admins.map((a) => a.telegramChatId!).filter(Boolean);
  if (chatIds.length === 0) return;

  await sendTelegramMessageToMany(
    chatIds,
    `💬 Новый вопрос в чате (${who}):\n«${text}»\n\nОтветить: /reply ${shortCode} ваш текст\nИли в админке: ${siteUrl('/admin/chats')}`,
  );
}
