// Одноразовый скрипт: убирает 10 тестовых заводов из prisma/seed.ts
// ("Завод №1 — Север Москвы" и т.д. с адресами вроде "Москва, Дмитровское
// ш., 100") вместе с их тестовыми логинами (plant1@bsb.test..plant10@bsb.test),
// когда реальные заводы уже заведены через админку (/admin/plants/new) и
// тестовые больше не нужны.
//
// В отличие от `npm run db:seed` (prisma/seed.ts) — этот скрипт НЕ трогает
// ничего, кроме именно этих 10 тестовых записей: не удаляет заказы, клиентов,
// администратора и любые другие заводы. Перед удалением проверяет, что на
// эти заводы не ссылается ни один заказ — если ссылается, останавливается и
// ничего не удаляет, чтобы не сломать историю заказов.
//
// Запуск (на сервере, с реальным DATABASE_URL в .env):
//   npx tsx scripts/remove-test-plants.ts          — покажет, что нашёл, ничего не удалит
//   npx tsx scripts/remove-test-plants.ts --yes     — удалит найденное

import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Тот же список, что в prisma/seed.ts — сверяем по точному совпадению
// названия и адреса, чтобы случайно не задеть реальный завод с похожим
// именем.
const TEST_PLANTS = [
  { name: 'Завод №1 — Север Москвы', address: 'Москва, Дмитровское ш., 100' },
  { name: 'Завод №2 — Восток Москвы', address: 'Москва, Щёлковское ш., 80' },
  { name: 'Завод №3 — Юг Москвы', address: 'Москва, Каширское ш., 45' },
  { name: 'Завод №4 — Запад Москвы', address: 'Москва, Можайское ш., 30' },
  { name: 'Завод №5 — Химки', address: 'Химки, Ленинградское ш., 12' },
  { name: 'Завод №6 — Мытищи', address: 'Мытищи, Осташковское ш., 5' },
  { name: 'Завод №7 — Люберцы', address: 'Люберцы, Октябрьский пр-т, 20' },
  { name: 'Завод №8 — Одинцово', address: 'Одинцово, Можайское ш., 141' },
  { name: 'Завод №9 — Красногорск', address: 'Красногорск, Волоколамское ш., 3' },
  { name: 'Завод №10 — Домодедово', address: 'Домодедово, Каширское ш., 100' },
] as const;

async function main() {
  const confirmed = process.argv.includes('--yes');

  const plants = await prisma.plant.findMany({
    where: { OR: TEST_PLANTS.map((p) => ({ name: p.name, address: p.address })) },
    include: { users: true, orders: { select: { id: true, orderNumber: true } } },
  });

  if (plants.length === 0) {
    console.log('Тестовые заводы не найдены в базе (уже удалены или это не та база?).');
    return;
  }

  console.log(`Найдено тестовых заводов: ${plants.length}`);
  for (const plant of plants) {
    console.log(`  — ${plant.name} (${plant.address}): логинов ${plant.users.length}, заказов ${plant.orders.length}`);
  }

  const plantsWithOrders = plants.filter((p) => p.orders.length > 0);
  if (plantsWithOrders.length > 0) {
    console.error(
      '\nСТОП: на часть тестовых заводов уже ссылаются реальные заказы — удаление сломало бы их историю.',
    );
    console.error('Заводы с заказами:', plantsWithOrders.map((p) => p.name).join(', '));
    console.error('Ничего не удалено. Разберитесь с этими заказами вручную, затем запустите скрипт снова.');
    process.exitCode = 1;
    return;
  }

  if (!confirmed) {
    console.log('\nЭто был просмотр без изменений. Чтобы правда удалить — запустите:');
    console.log('  npx tsx scripts/remove-test-plants.ts --yes');
    return;
  }

  const plantIds = plants.map((p) => p.id);

  const deletedUsers = await prisma.user.deleteMany({
    where: { plantId: { in: plantIds }, role: 'PLANT' },
  });
  const deletedPlants = await prisma.plant.deleteMany({
    where: { id: { in: plantIds } },
  });

  console.log(`\nГотово: удалено заводов — ${deletedPlants.count}, логинов — ${deletedUsers.count}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
