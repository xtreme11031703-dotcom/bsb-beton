import crypto from 'crypto';

// Проверка подписи Telegram WebApp initData — алгоритм строго по документации:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Без этой проверки любой мог бы прислать поддельный initData и залогиниться
// под чужим Telegram-аккаунтом, поэтому валидация обязательна и делается
// только на сервере (секретный bot-токен никогда не попадает в браузер).

export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

type ValidationResult =
  | { ok: true; user: TelegramWebAppUser }
  | { ok: false; error: string };

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // initData старше суток не принимаем

export function validateTelegramInitData(initData: string, botToken: string): ValidationResult {
  if (!initData) return { ok: false, error: 'Пустой initData' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'Нет hash в initData' };
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computedHash);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Неверная подпись initData' };
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, error: 'initData устарел, откройте приложение заново' };
  }

  const userJson = params.get('user');
  if (!userJson) return { ok: false, error: 'Нет данных пользователя в initData' };

  try {
    const user = JSON.parse(userJson) as TelegramWebAppUser;
    return { ok: true, user };
  } catch {
    return { ok: false, error: 'Не удалось разобрать данные пользователя' };
  }
}
