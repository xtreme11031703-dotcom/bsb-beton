import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, siteUrl, TELEGRAM_MINIAPP_URL } from '@/lib/telegram';
import { answerFaq } from '@/lib/telegram-faq';
import { ORDER_STATUS_LABELS } from '@/lib/utils';

// Telegram шлёт обновления сюда после setWebhook (см. scripts/telegram-set-webhook.ts).
// Секрет проверяем через заголовок X-Telegram-Bot-Api-Secret-Token — так Telegram
// подтверждает, что запрос действительно от него, а не от кого попало.
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get('x-telegram-bot-api-secret-token');
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true }); // нечего обрабатывать (не текстовое сообщение и т.п.)
  }

  await handleMessage(chatId, text.trim());
  return NextResponse.json({ ok: true });
}

async function handleMessage(chatId: string, text: string) {
  // /start или /start CODE (диплинк вида t.me/bot?start=CODE)
  if (text === '/start' || text.startsWith('/start ')) {
    const code = text.split(' ')[1];
    if (code) {
      await tryLinkAccount(chatId, code);
      return;
    }
    await sendTelegramMessage(
      chatId,
      'Привет! Это бот БСБ — бетон с доставкой.\n\n' +
        'Быстрее всего оформить и отслеживать заказ прямо в приложении ниже. ' +
        'Также можно спросить про цены, марки бетона, доставку или адреса заводов — постараюсь ответить, ' +
        'а если у вас уже есть аккаунт на сайте — привяжите его командой /link КОД (код — в личном кабинете).',
      TELEGRAM_MINIAPP_URL
        ? { replyMarkup: { inline_keyboard: [[{ text: '📱 Открыть приложение', web_app: { url: TELEGRAM_MINIAPP_URL } }]] } }
        : undefined,
    );
    return;
  }

  if (text.startsWith('/link')) {
    const code = text.split(' ')[1];
    if (!code) {
      await sendTelegramMessage(chatId, 'Укажите код после команды, например: /link AB12CD');
      return;
    }
    await tryLinkAccount(chatId, code);
    return;
  }

  if (text.startsWith('/status')) {
    await sendOrderStatusSummary(chatId);
    return;
  }

  if (text.startsWith('/reply')) {
    await tryReplyToChatThread(chatId, text);
    return;
  }

  if (text.startsWith('/help')) {
    await sendTelegramMessage(
      chatId,
      'Команды:\n/app — открыть приложение (заказ и статус)\n/link КОД — привязать аккаунт с сайта\n/status — статус ваших последних заказов\n\nИли просто напишите вопрос про бетон, цены или доставку.',
    );
    return;
  }

  if (text.startsWith('/app')) {
    if (!TELEGRAM_MINIAPP_URL) {
      await sendTelegramMessage(chatId, 'Приложение пока не настроено — попробуйте позже.');
      return;
    }
    await sendTelegramMessage(chatId, 'Открыть приложение:', {
      replyMarkup: { inline_keyboard: [[{ text: '📱 Открыть приложение', web_app: { url: TELEGRAM_MINIAPP_URL } }]] },
    });
    return;
  }

  // Всё остальное — простой FAQ-помощник по ключевым словам.
  await sendTelegramMessage(chatId, answerFaq(text));
}

async function tryLinkAccount(chatId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { telegramLinkCode: code.toUpperCase() } });
  if (!user) {
    await sendTelegramMessage(
      chatId,
      'Код не найден или уже использован. Сгенерируйте новый код в личном кабинете на сайте и попробуйте снова.',
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: chatId, telegramLinkCode: null },
  });

  const roleText =
    user.role === 'PLANT'
      ? 'Теперь сюда будут приходить уведомления о новых заказах для вашего завода.'
      : user.role === 'ADMIN'
        ? 'Теперь сюда будут приходить уведомления о новых заказах.'
        : 'Теперь сюда будут приходить уведомления об изменении статуса ваших заказов.';

  await sendTelegramMessage(chatId, `Готово, ${user.name}! Аккаунт привязан. ${roleText}`);
}

/** Позволяет админу ответить в чат с сайта прямо из Telegram, не заходя в
 * админку: /reply КОД текст ответа — код приходит в уведомлении о новом
 * сообщении (см. app/actions/chat.ts:notifyAdminsNewChatMessage). */
async function tryReplyToChatThread(chatId: string, text: string) {
  const admin = await prisma.user.findFirst({ where: { telegramChatId: chatId, role: 'ADMIN' } });
  if (!admin) {
    await sendTelegramMessage(chatId, 'Команда /reply доступна только администраторам.');
    return;
  }

  const match = text.match(/^\/reply\s+(\S+)\s+([\s\S]+)$/i);
  if (!match) {
    await sendTelegramMessage(chatId, 'Формат: /reply КОД текст ответа (код — в уведомлении о новом сообщении чата).');
    return;
  }
  const [, code, replyText] = match;

  const thread = await prisma.chatThread.findUnique({ where: { shortCode: code.toUpperCase() } });
  if (!thread) {
    await sendTelegramMessage(chatId, `Диалог с кодом ${code} не найден.`);
    return;
  }

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { threadId: thread.id, sender: 'ADMIN', text: replyText.trim() } }),
    prisma.chatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), visitorUnread: true, adminUnread: false, status: 'OPEN' },
    }),
  ]);

  await sendTelegramMessage(chatId, `Ответ отправлен в чат ${thread.shortCode}.`);
}

async function sendOrderStatusSummary(chatId: string) {
  const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
  if (!user) {
    await sendTelegramMessage(chatId, 'Сначала привяжите аккаунт: /link КОД (код — в личном кабинете на сайте).');
    return;
  }

  if (user.role !== 'CLIENT') {
    await sendTelegramMessage(chatId, 'Команда /status пока доступна только клиентам.');
    return;
  }

  const orders = await prisma.order.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (orders.length === 0) {
    await sendTelegramMessage(chatId, `У вас пока нет заказов. Оформить: ${siteUrl('/order/new')}`);
    return;
  }

  const lines = orders.map((o) => {
    const status = ORDER_STATUS_LABELS[o.status];
    return `${o.orderNumber} — ${status.emoji} ${status.label}`;
  });

  await sendTelegramMessage(chatId, `Ваши последние заказы:\n\n${lines.join('\n')}`);
}
