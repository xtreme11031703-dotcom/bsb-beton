// Одноразовый скрипт: делает кнопку слева от поля ввода в чате с ботом
// постоянной кнопкой открытия Mini App (вместо стандартного "Меню").
//
//   npx tsx scripts/telegram-set-menu-button.ts

try {
  process.loadEnvFile();
} catch {
  // .env отсутствует — ок
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!token) {
  console.error('Не задан TELEGRAM_BOT_TOKEN в окружении.');
  process.exit(1);
}
if (!appUrl) {
  console.error('Не задан NEXT_PUBLIC_APP_URL в окружении (домен сайта, например https://bsb-beton.ru).');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text: 'Заказать',
        web_app: { url: `${appUrl!.replace(/\/$/, '')}/miniapp` },
      },
    }),
  });
  console.log(await res.json());
}

main();

export {}; // делает файл модулем, чтобы верхнеуровневые имена не конфликтовали с другими скриптами
