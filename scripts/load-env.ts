// Минимальный загрузчик .env для standalone tsx-скриптов — без внешних
// зависимостей и без опоры на process.loadEnvFile() (появился только в
// Node 20.6+, а в проекте таргетируются и более старые версии Node).
import fs from 'fs';
import path from 'path';

export function loadEnv(filename = '.env') {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // убираем обрамляющие кавычки, если есть
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // не перезаписываем переменные, уже заданные явно в окружении
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
