import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';

export const metadata = {
  title: `Реквизиты — ${company.fullName}`,
  description: 'Юридические и банковские реквизиты ООО «Бетонстрой-Билдинг».',
};

const rows: Array<[string, string]> = [
  ['Полное наименование', company.requisites.fullOrgName],
  ['Сокращённое наименование', company.requisites.shortOrgName],
  ['Юридический адрес', company.requisites.legalAddress],
  ['ИНН', company.requisites.inn],
  ['КПП', company.requisites.kpp],
  ['ОГРН', company.requisites.ogrn],
  ['Генеральный директор', company.requisites.director],
  ['Система налогообложения', company.requisites.taxation],
];

const bankRows: Array<[string, string]> = [
  ['Расчётный счёт', company.requisites.bankAccount],
  ['Банк', company.requisites.bankName],
  ['БИК', company.requisites.bankBik],
  ['Корреспондентский счёт', company.requisites.correspondentAccount],
];

export default function RekvizityPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Реквизиты
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Официальные реквизиты {company.requisites.shortOrgName} для заключения договоров и
                оплаты по счёту.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <Reveal>
            <div className="card overflow-hidden !p-0">
              <div className="border-b border-surface-border bg-surface-muted px-5 py-3">
                <h2 className="text-sm font-semibold text-navy-700">Юридические данные</h2>
              </div>
              <dl className="divide-y divide-surface-border">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm text-navy-500">{label}</dt>
                    <dd className="text-sm font-medium text-navy-800 sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="card mt-6 overflow-hidden !p-0">
              <div className="border-b border-surface-border bg-surface-muted px-5 py-3">
                <h2 className="text-sm font-semibold text-navy-700">Банковские реквизиты</h2>
              </div>
              <dl className="divide-y divide-surface-border">
                {bankRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm text-navy-500">{label}</dt>
                    <dd className="text-sm font-medium text-navy-800 sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-navy-800 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">Нужны реквизиты для договора?</h2>
                <p className="mt-1 text-sm text-navy-200">
                  Свяжитесь с нами — вышлем полный комплект документов и подготовим счёт.
                </p>
              </div>
              <a href={company.phoneHref} className="btn-primary shrink-0">
                {company.phone}
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
