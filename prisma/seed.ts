import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PLANTS = [
  { name: 'Завод №1 — Север Москвы', address: 'Москва, Дмитровское ш., 100', latitude: 55.8621, longitude: 37.5406, phone: '+7 495 100-00-01' },
  { name: 'Завод №2 — Восток Москвы', address: 'Москва, Щёлковское ш., 80', latitude: 55.8058, longitude: 37.8267, phone: '+7 495 100-00-02' },
  { name: 'Завод №3 — Юг Москвы', address: 'Москва, Каширское ш., 45', latitude: 55.6203, longitude: 37.6636, phone: '+7 495 100-00-03' },
  { name: 'Завод №4 — Запад Москвы', address: 'Москва, Можайское ш., 30', latitude: 55.7233, longitude: 37.4189, phone: '+7 495 100-00-04' },
  { name: 'Завод №5 — Химки', address: 'Химки, Ленинградское ш., 12', latitude: 55.8970, longitude: 37.4297, phone: '+7 495 100-00-05' },
  { name: 'Завод №6 — Мытищи', address: 'Мытищи, Осташковское ш., 5', latitude: 55.9116, longitude: 37.7307, phone: '+7 495 100-00-06' },
  { name: 'Завод №7 — Люберцы', address: 'Люберцы, Октябрьский пр-т, 20', latitude: 55.6763, longitude: 37.8936, phone: '+7 495 100-00-07' },
  { name: 'Завод №8 — Одинцово', address: 'Одинцово, Можайское ш., 141', latitude: 55.6753, longitude: 37.2758, phone: '+7 495 100-00-08' },
  { name: 'Завод №9 — Красногорск', address: 'Красногорск, Волоколамское ш., 3', latitude: 55.8256, longitude: 37.3306, phone: '+7 495 100-00-09' },
  { name: 'Завод №10 — Домодедово', address: 'Домодедово, Каширское ш., 100', latitude: 55.4356, longitude: 37.7683, phone: '+7 495 100-00-10' },
] as const;

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('Очистка базы данных…');
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderPlant.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plant.deleteMany();

  console.log('Создаём заводы…');
  const createdPlants = [];
  for (const p of PLANTS) {
    const plant = await prisma.plant.create({
      data: {
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        status: 'ACTIVE',
        radiusKm: 50,
        materials: ['CONCRETE', 'SAND', 'GRAVEL', 'CEMENT', 'MORTAR'],
      },
    });
    createdPlants.push(plant);
  }

  console.log('Создаём администратора…');
  await prisma.user.create({
    data: {
      name: 'Администратор БСБ',
      email: 'admin@bsb.test',
      phone: '+7 495 000-00-00',
      passwordHash: await hash('Admin123!'),
      role: 'ADMIN',
    },
  });

  console.log('Создаём аккаунты заводов…');
  for (let i = 0; i < createdPlants.length; i++) {
    await prisma.user.create({
      data: {
        name: `Оператор ${createdPlants[i].name}`,
        email: `plant${i + 1}@bsb.test`,
        phone: createdPlants[i].phone,
        passwordHash: await hash('Plant123!'),
        role: 'PLANT',
        plantId: createdPlants[i].id,
      },
    });
  }

  console.log('Создаём тестового клиента…');
  await prisma.user.create({
    data: {
      name: 'Тестовый клиент',
      email: 'client@bsb.test',
      phone: '+7 900 000-00-00',
      passwordHash: await hash('Client123!'),
      role: 'CLIENT',
    },
  });

  console.log('Готово! Тестовые аккаунты:');
  console.log('  Админ:   admin@bsb.test / Admin123!');
  console.log('  Завод 1: plant1@bsb.test / Plant123! (и plant2..plant10 аналогично)');
  console.log('  Клиент:  client@bsb.test / Client123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
