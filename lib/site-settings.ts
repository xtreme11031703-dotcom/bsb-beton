import { prisma } from '@/lib/prisma';
import { company } from '@/lib/company';

export type SiteFaqItem = { question: string; answer: string };

export type SiteSettingsData = {
  phone: string;
  phoneHref: string;
  email: string;
  workHours: string;
  faq: SiteFaqItem[];
};

const FALLBACK: SiteSettingsData = {
  phone: company.phone,
  phoneHref: company.phoneHref,
  email: company.email,
  workHours: company.workHours,
  faq: company.faq.map((item) => ({ question: item.question, answer: item.answer })),
};

/**
 * Контакты и FAQ, редактируемые админом через /admin/settings (модель
 * SiteSettings в prisma/schema.prisma). Пока строка "default" не заведена
 * (например, seed-скрипт scripts/seed-site-settings.ts ещё не запускался на
 * этом окружении) — отдаём значения по умолчанию из lib/company.ts, чтобы
 * сайт не показывал пустые контакты.
 *
 * Специально НЕ трогает остальные поля company.ts (branches, stats,
 * serviceCategories, nav) — они завязаны на роутинг и бизнес-логику и
 * остаются в коде, см. комментарий у модели SiteSettings.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!row) return FALLBACK;
  return {
    phone: row.phone,
    phoneHref: row.phoneHref,
    email: row.email,
    workHours: row.workHours,
    faq: Array.isArray(row.faq) && row.faq.length > 0 ? (row.faq as SiteFaqItem[]) : FALLBACK.faq,
  };
}
