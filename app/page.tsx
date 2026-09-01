import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { CountUp } from '@/components/CountUp';
import YandexMap from '@/components/YandexMap';
import { company } from '@/lib/company';

const benefits = [
  {
    title: 'Быстрая подача заявки',
    text: 'Оформление заказа занимает пару минут — без звонков и лишних форм.',
  },
  {
    title: 'Доставка по Москве и МО',
    text: 'Работаем с проверенными заводами в радиусе всего региона.',
  },
  {
    title: 'Бетононасос',
    text: 'Подберём автобетононасос или стационарный насос под ваш объект.',
  },
  {
    title: 'Проверенные заводы',
    text: 'Заказ получает завод, который ближе и готов взять его первым.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-surface-border bg-navy-700">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-navy-400/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-24">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Бетон с доставкой по Москве и Московской области
              </h1>
            </Reveal>

            <Reveal delayMs={100}>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Рассчитайте заказ и оформите доставку за несколько минут
              </p>
            </Reveal>

            <Reveal delayMs={200}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/order/new" className="btn-primary">
                  Заказать бетон
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-xl border border-navy-400 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-navy-600"
                >
                  О компании
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {company.stats.map((stat, i) => (
              <Reveal key={stat.label} delayMs={i * 70}>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-navy-700 sm:text-3xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-navy-500">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delayMs={i * 90}>
                <div className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <h3 className="font-semibold text-navy-700">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Яндекс Карта */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-navy-700">
                Работаем по Москве и Московской области
              </h2>

              <p className="mt-2 text-sm text-navy-500">
                Выберите адрес доставки при оформлении заказа — мы подберём
                подходящий бетонный завод.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="overflow-hidden rounded-2xl border border-surface-border shadow-sm">
              <YandexMap />
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Готовы оформить заказ?
                </h2>

                <p className="mt-1 text-sm text-navy-200">
                  Укажите материал, объём и адрес — мы найдём подходящий завод.
                </p>
              </div>

              <Link href="/order/new" className="btn-primary shrink-0">
                Заказать бетон
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
