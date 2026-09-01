// Одноразовый скрипт: задаёт список команд, который Telegram показывает
// пользователю в меню бота (кнопка "/" рядом с полем ввода).
//
//   npx tsx scripts/telegram-set-commands.ts

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Не задан TELEGRAM_BOT_TOKEN в окружении.');
  process.exit(1);
}

const commands = [
  { command: 'start', description: 'Начать работу с ботом' },
  { command: 'link', description: 'Привязать аккаунт с сайта (нужен код из личного кабинета)' },
  { command: 'status', description: 'Статус ваших последних заказов' },
  { command: 'help', description: 'Список команд' },
];

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });
  console.log(await res.json());
}

main();

export {}; // делает файл модулем, чтобы верхнеуровневые имена не конфликтовали с другими скриптами
