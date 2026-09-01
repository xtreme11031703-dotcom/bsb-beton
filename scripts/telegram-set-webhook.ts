// Одноразовый скрипт: регистрирует webhook в Telegram, чтобы обновления
// шли на app/api/telegram/webhook. Запускать один раз после деплоя (или
// заново — после смены домена):
//
//   npx tsx scripts/telegram-set-webhook.ts https://ваш-домен.ru
//
// Требует переменные окружения TELEGRAM_BOT_TOKEN и (опционально,
// но рекомендуется) TELEGRAM_WEBHOOK_SECRET — они должны совпадать с теми,
// что заданы в .env приложения.

// В отличие от `next dev`/`prisma`, обычный tsx-скрипт .env сам не читает —
// подгружаем вручную (Node 20.6+). Если файла нет (например, в проде,
// где переменные заданы платформой хостинга) — просто продолжаем.
try {
  process.loadEnvFile();
} catch {
  // .env отсутствует — ок
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const domain = process.argv[2];

if (!token) {
  console.error('Не задан TELEGRAM_BOT_TOKEN в окружении.');
  process.exit(1);
}

if (!domain) {
  console.error('Использование: npx tsx scripts/telegram-set-webhook.ts https://ваш-домен.ru');
  process.exit(1);
}

async function main() {
  const url = `${domain.replace(/\/$/, '')}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret || undefined,
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();
  console.log(data);

  if (!data.ok) {
    process.exit(1);
  }

  console.log(`\nWebhook установлен: ${url}`);
  if (!secret) {
    console.warn(
      'Внимание: TELEGRAM_WEBHOOK_SECRET не задан — webhook работает без проверки секрета. ' +
        'Рекомендуется задать его в .env и перезапустить этот скрипт.',
    );
  }
}

main();

export {}; // делает файл модулем, чтобы верхнеуровневые имена не конфликтовали с другими скриптами
