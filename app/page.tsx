import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import YandexMap from '@/components/YandexMap';

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
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              Бетон с доставкой по Москве и Московской области
            </h1>

            <p className="mt-4 max-w-xl text-lg text-navy-100">
              Рассчитайте заказ и оформите доставку за несколько минут
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/order/new" className="btn-primary">
                Заказать бетон
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-navy-400 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-navy-600"
              >
                Войти
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="card">
                <h3 className="font-semibold text-navy-700">
                  {b.title}
                </h3>

                <p className="mt-1.5 text-sm text-navy-500">
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Яндекс Карта */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-navy-700">
              Работаем по Москве и Московской области
            </h2>

            <p className="mt-2 text-sm text-navy-500">
              Выберите адрес доставки при оформлении заказа — мы подберём
              подходящий бетонный завод.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-border shadow-sm">
            <YandexMap />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Готовы оформить заказ?
              </h2>

              <p className="mt-1 text-sm text-navy-200">
                Укажите материал, объём и адрес — мы найдём подходящий завод.
              </p>
            </div>

            <Link
              href="/order/new"
              className="btn-primary shrink-0"
            >
              Заказать бетон
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
