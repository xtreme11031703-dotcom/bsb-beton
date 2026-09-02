'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Требуются права администратора');
  return session;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function isValidPhoneHref(value: string) {
  return /^tel:\+?[0-9]+$/.test(value);
}

export async function updateSiteSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const phone = String(formData.get('phone') ?? '').trim();
  const phoneHref = String(formData.get('phoneHref') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const workHours = String(formData.get('workHours') ?? '').trim();
  const faqRaw = String(formData.get('faq') ?? '[]');

  if (!phone) return { ok: false, error: 'Укажите телефон' };
  if (!isValidPhoneHref(phoneHref)) {
    return { ok: false, error: 'Ссылка для звонка должна быть вида tel:+74950856606' };
  }
  if (!email || !email.includes('@')) return { ok: false, error: 'Укажите корректный email' };
  if (!workHours) return { ok: false, error: 'Укажите часы работы' };

  let faq: { question: string; answer: string }[];
  try {
    const parsed = JSON.parse(faqRaw);
    if (!Array.isArray(parsed)) throw new Error('faq is not an array');
    faq = parsed
      .map((item) => ({
        question: String(item?.question ?? '').trim(),
        answer: String(item?.answer ?? '').trim(),
      }))
      .filter((item) => item.question && item.answer);
  } catch {
    return { ok: false, error: 'Не удалось сохранить вопросы-ответы' };
  }

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', phone, phoneHref, email, workHours, faq },
    update: { phone, phoneHref, email, workHours, faq },
  });

  revalidatePath('/admin/settings');
  // Телефон/email/часы работы и FAQ используются на множестве страниц
  // (главная, контакты, футер на каждой странице и т.д.) — проще сбросить
  // кеш всего сайта, чем перечислять каждый путь по отдельности.
  revalidatePath('/', 'layout');
  return { ok: true };
}
