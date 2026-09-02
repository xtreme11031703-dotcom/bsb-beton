// Тонкий клиент Telegram Bot API — без сторонних библиотек (fetch есть в Node 18+/Next.js).
// Токен и секрет вебхука берутся из окружения, чтобы их никогда не было в коде/репозитории.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

type InlineKeyboardButton =
  | { text: string; url: string }
  | { text: string; web_app: { url: string } };

type SendMessageOptions = {
  parseMode?: 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
};

/**
 * Отправляет сообщение в чат Telegram. Если токен не настроен (например, в деве
 * без .env) — тихо логирует и ничего не бросает, чтобы не ронять бизнес-логику
 * заказов из-за отсутствующей интеграции.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: SendMessageOptions = {},
): Promise<void> {
  if (!API_BASE) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено:', text);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode ?? 'HTML',
        disable_web_page_preview: options.disableWebPagePreview ?? true,
        reply_markup: options.replyMarkup,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[telegram] sendMessage failed', res.status, body);
    }
  } catch (err) {
    // Сеть/Telegram недоступны — не должно ломать оформление заказа.
    console.error('[telegram] sendMessage error', err);
  }
}

/** Отправляет одно и то же сообщение сразу нескольким чатам, не дожидаясь по очереди. */
export async function sendTelegramMessageToMany(
  chatIds: string[],
  text: string,
  options?: SendMessageOptions,
): Promise<void> {
  await Promise.all(chatIds.map((chatId) => sendTelegramMessage(chatId, text, options)));
}

/** Генерирует короткий человекочитаемый код для привязки Telegram-аккаунта. */
export function generateLinkCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** Имя бота для ссылок вида t.me/<username> — задаётся один раз в .env после /newbot. */
export const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

/** URL Telegram Mini App — /miniapp на боевом домене сайта. */
export const TELEGRAM_MINIAPP_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/miniapp`
  : '';

/**
 * Собирает ссылку на страницу САЙТА (не bsb-beton.ru — это отдельная, чужая
 * для этого приложения компания-домен) для текстов сообщений бота. Домен
 * берётся из NEXT_PUBLIC_APP_URL — той же переменной, что и для Mini App.
 * Если она не задана в окружении, возвращаем просто путь, а не битую ссылку
 * на посторонний сайт.
 */
export function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  return `${base}${path}`;
}
