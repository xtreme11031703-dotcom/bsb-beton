// Заводит единственную строку SiteSettings (id "default") из текущих
// значений lib/company.ts — телефон, email, часы работы, вопросы-ответы.
// Нужно запустить ОДИН РАЗ после `prisma db push`.
//
// Идемпотентен: если строка "default" уже есть (например, админ уже что-то
// поменял через /admin/settings), скрипт ничего не трогает.
import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';
import { company } from '../lib/company';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (existing) {
    console.log('SiteSettings уже существует — ничего не делаю.');
    return;
  }

  await prisma.siteSettings.create({
    data: {
      id: 'default',
      phone: company.phone,
      phoneHref: company.phoneHref,
      email: company.email,
      workHours: company.workHours,
      faq: company.faq.map((item) => ({ question: item.question, answer: item.answer })),
    },
  });

  console.log('Готово: SiteSettings создан из текущих значений lib/company.ts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
