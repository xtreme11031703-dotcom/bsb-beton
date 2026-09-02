import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { CountUp } from '@/components/CountUp';
import { company } from '@/lib/company';
import { ClockIcon, TruckIcon, DocumentCheckIcon, RouteIcon } from '@/components/icons';

const uspIcons = [ClockIcon, TruckIcon, DocumentCheckIcon, RouteIcon];

export const metadata = {
  title: `О компании — ${company.fullName}`,
  description: company.description,
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                О компании {company.fullName}
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">{company.description}</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {company.stats.map((stat, i) => (
              <Reveal key={stat.label} delayMs={i * 80}>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-navy-700 sm:text-4xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-navy-500 sm:text-sm">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Почему выбирают нас</h2>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {company.usps.map((u, i) => {
              const Icon = uspIcons[i % uspIcons.length];
              return (
                <Reveal key={u.title} delayMs={i * 100}>
                  <div className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-semibold text-navy-700">{u.title}</h3>
                    <p className="mt-1.5 text-sm text-navy-500">{u.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Сертификация</h2>
            <p className="mt-2 max-w-2xl text-sm text-navy-500">
              Продукция сопровождается декларациями соответствия ГОСТ. Оригиналы документов
              предоставляются по запросу к каждой поставке.
            </p>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {company.certificates.map((cert, i) => (
              <Reveal key={cert.title} delayMs={i * 100}>
                <div className="card h-full">
                  <h3 className="font-semibold text-navy-700">{cert.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">№ {cert.number}</p>
                  <p className="mt-1 text-sm text-navy-500">{cert.standard}</p>
                  <p className="mt-1 text-xs text-navy-400">Действует {cert.validity}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delayMs={220}>
            <Link href="/sertifikaty" className="btn-secondary mt-6 inline-flex">
              Смотреть сканы документов →
            </Link>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Готовы оформить заказ?</h2>
              <p className="mt-1 text-sm text-navy-200">
                Укажите материал, объём и адрес — мы найдём подходящий завод.
              </p>
            </div>
            <Link href="/order/new" className="btn-primary shrink-0">
              Заказать бетон
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
