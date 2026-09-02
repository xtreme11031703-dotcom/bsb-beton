// Одноразовый скрипt: заводит реальные заводы/филиалы (список сверен с
// bsb-beton.ru/contacts, сентябрь 2026) сразу в базу — чтобы не забивать
// вручную 16 карточек через /admin/plants/new одну за другой.
//
// ВАЖНО про координаты: у большинства точек ниже (особенно деревни/посёлки —
// Петровское, Часцы, Курилово, Горки, Крекшино, Новосиньково, Спас-Заулок,
// Кривцово) координаты — приблизительная оценка по названию населённого
// пункта, НЕ результат геокодирования по точному адресу (серверный Геокодер
// Яндекса сейчас не работает — см. отдельную переписку по 403 "Invalid api
// key"). Точность может быть в пределах нескольких километров. После
// создания зайдите в каждый завод в админке (/admin/plants/<id>) и
// перетащите точку на карте на точное место — это не требует геокодера,
// только глаз и Яндекс.Карты в соседней вкладке для сверки.
//
// Запуск (на сервере, с реальным DATABASE_URL в .env):
//   npx tsx scripts/add-real-plants.ts          — покажет, что создаст, ничего не создаст
//   npx tsx scripts/add-real-plants.ts --yes     — правда создаст
//
// Скрипт идемпотентен: заводы, которые уже есть в базе (по точному
// совпадению названия), пропускает, а не дублирует — можно запускать
// повторно после того, как что-то добавили руками.

import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PHONE = '+7 495 085-66-06';
// Полный набор категорий каталога — по умолчанию считаем, что новый завод
// умеет всё (см. Plant.categories в schema.prisma); при необходимости
// сузить список — это делается потом в самой админке.
const DEFAULT_CATEGORIES = [
  'BETON',
  'TOSHCHIY_BETON',
  'VYSOKOPROCHNYY_BETON',
  'POLISTIROLBETON',
  'RASTVORY',
  'NASOS',
] as const;

const REAL_PLANTS = [
  // Одновременно офис и действующий завод.
  { name: 'Главный офис', address: 'Москва, ул. 2-я Магистральная, 3с1', latitude: 55.7487, longitude: 37.4994 },
  { name: 'Верхние Поля', address: 'Москва, ул. Верхние Поля, 65с3', latitude: 55.657, longitude: 37.777 },
  { name: 'Горбунова', address: 'Москва, ул. Горбунова, 2', latitude: 55.7365, longitude: 37.4585 },
  { name: 'Наро-Фоминск', address: 'село Петровское, 160', latitude: 55.35, longitude: 36.65 },
  { name: 'Одинцово', address: 'посёлок Часцы, Можайское шоссе, 199/7', latitude: 55.672, longitude: 37.19 },
  { name: 'Истра', address: 'Советская улица, 76С', latitude: 55.913, longitude: 36.86 },
  { name: 'Солнечногорск', address: 'деревня Курилово', latitude: 56.15, longitude: 36.95 },
  { name: 'Химки', address: 'Химки', latitude: 55.897, longitude: 37.4297 },
  { name: 'Подольск', address: 'Подольск, ул. Северная, 13с4', latitude: 55.45, longitude: 37.545 },
  { name: 'Раменское', address: 'Раменское', latitude: 55.5711, longitude: 38.221 },
  { name: 'Домодедово', address: 'Домодедово, деревня Горки, 1Б', latitude: 55.42, longitude: 37.85 },
  { name: 'Крекшино', address: 'Крекшино, ул. Производственная, 312', latitude: 55.58, longitude: 37.17 },
  { name: 'Дмитров', address: 'Дмитров, посёлок Новосиньково', latitude: 56.26, longitude: 37.48 },
  { name: 'Клин', address: 'Клин, село Спас-Заулок', latitude: 56.235, longitude: 36.785 },
  { name: 'Тверь', address: 'Тверь, деревня Кривцово', latitude: 56.8, longitude: 35.95 },
  { name: 'Тула', address: 'Тула', latitude: 54.1932, longitude: 37.6172 },
  // "Скоро открытие" (Екатеринбург, Казань, Санкт-Петербург) сюда намеренно
  // не включены — заводов там ещё физически нет, добавить в базу
  // предлагается уже после реального открытия.
];

async function main() {
  const confirmed = process.argv.includes('--yes');

  const existing = await prisma.plant.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((p) => p.name));

  const toCreate = REAL_PLANTS.filter((p) => !existingNames.has(p.name));
  const skipped = REAL_PLANTS.filter((p) => existingNames.has(p.name));

  console.log(`К созданию: ${toCreate.length}. Уже есть в базе (пропускаются): ${skipped.length}.`);
  for (const p of skipped) console.log(`  — пропущен (уже есть): ${p.name}`);
  for (const p of toCreate) console.log(`  — будет создан: ${p.name} (${p.address}) [${p.latitude}, ${p.longitude}]`);

  if (toCreate.length === 0) {
    console.log('\nСоздавать нечего.');
    return;
  }

  if (!confirmed) {
    console.log('\nЭто был просмотр без изменений. Чтобы правда создать — запустите:');
    console.log('  npx tsx scripts/add-real-plants.ts --yes');
    return;
  }

  console.log('');
  for (const p of toCreate) {
    const plant = await prisma.plant.create({
      data: {
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: DEFAULT_PHONE,
        status: 'ACTIVE',
        radiusKm: 50,
        categories: [...DEFAULT_CATEGORIES],
      },
    });
    console.log(`Создан: ${plant.name} → /admin/plants/${plant.id}`);
  }

  console.log(
    '\nГотово. Дальше в админке для каждого: 1) сверьте/подвиньте точку на карте на точный ' +
      'адрес, 2) при необходимости поправьте телефон (сейчас у всех — общий номер компании), ' +
      '3) заведите логин сотруднику в блоке "Логины сотрудников завода".',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
