import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { CountUp } from '@/components/CountUp';
import YandexMap from '@/components/YandexMap';
import { company } from '@/lib/company';
import { getPublicPlantLocations } from '@/app/actions/plants';
import { geocodeAddress } from '@/lib/yandex-geocoder';
import { PLANT_PHOTO } from '@/lib/category-photos';
import { BoltIcon, TruckIcon, PumpIcon, FactoryIcon } from '@/components/icons';

const benefits = [
  {
    title: 'Быстрая подача заявки',
    text: 'Оформление заказа занимает пару минут — без звонков и лишних форм.',
    icon: BoltIcon,
    big: true,
  },
  {
    title: 'Доставка по Москве и МО',
    text: 'Работаем с проверенными заводами в радиусе всего региона.',
    icon: TruckIcon,
  },
  {
    title: 'Бетононасос',
    text: 'Подберём автобетононасос или стационарный насос под ваш объект.',
    icon: PumpIcon,
  },
  {
    title: 'Проверенные заводы',
    text: 'Заказ получает завод, который ближе и готов взять его первым.',
    icon: FactoryIcon,
  },
];

export default async function HomePage() {
  const plants = await getPublicPlantLocations();

  // Главный офис не хранится в таблице заводов (это не производственная
  // площадка) — геокодируем его адрес из company.branches один раз на
  // сервере, чтобы показать точку на карте вместе с заводами.
  const headOfficeBranch = company.branches.find((b) => b.name === 'Главный офис');
  const headOfficeGeocoded =
    headOfficeBranch
      ? await geocodeAddress(headOfficeBranch.address, 60 * 60 * 24).catch(() => null)
      : null;
  const headOffice = headOfficeGeocoded
    ? { name: headOfficeBranch!.name, latitude: headOfficeGeocoded.latitude, longitude: headOfficeGeocoded.longitude }
    : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative bg-navy-900">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-fade opacity-60" />
            <div
              aria-hidden
              className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-[100px]"
            />
            <div
              aria-hidden
              className="absolute -bottom-40 left-0 h-[26rem] w-[26rem] rounded-full bg-navy-400/25 blur-[100px]"
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-28 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8">
            <div>
              <span className="eyebrow">🕐 Работаем ежедневно, {company.workHours.split(', ')[1] ?? '6:00–22:00'}</span>

              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tightest text-white sm:text-6xl">
                Бетон с доставкой{' '}
                <span className="gradient-text animate-gradient-x">по Москве и области</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg text-navy-200">
                Рассчитайте заказ и оформите доставку за несколько минут — материал, марка, объём
                и адрес в одной форме.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/order/new" className="btn-primary">
                  Заказать бетон
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  О компании
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <img
                src={PLANT_PHOTO.url}
                alt={PLANT_PHOTO.alt}
                loading="eager"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          {/* Плавающая статистика — перекрывает низ hero. Без Reveal: это
              контент первого экрана, он должен быть виден сразу, а не
              "проявляться" при загрузке (анимация transform+opacity на
              видимом сразу тексте выглядела как временная расфокусировка). */}
          <div className="relative mx-auto -mb-16 max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-surface-border bg-surface-border shadow-lift sm:grid-cols-3 lg:grid-cols-6">
              {company.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center justify-center gap-1 bg-white px-3 py-6 text-center sm:px-4">
                  <div className="text-2xl font-extrabold text-navy-800 sm:text-3xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[11px] leading-snug text-navy-500 sm:text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENTO-СЕТКА ПРЕИМУЩЕСТВ */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
          <Reveal>
            <h2 className="max-w-md text-2xl font-bold tracking-tight text-navy-800 sm:text-3xl">
              Всё для быстрой доставки бетона
            </h2>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal
                key={b.title}
                delayMs={i * 90}
                className={b.big ? 'sm:col-span-2 lg:col-span-2 lg:row-span-1' : ''}
              >
                <div
                  className={`card card-hover h-full ${
                    b.big ? 'bg-navy-800 text-white' : ''
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      b.big ? 'bg-white/10 text-white' : 'bg-accent-500/10 text-accent-600'
                    }`}
                  >
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className={`mt-3 font-semibold ${b.big ? 'text-white' : 'text-navy-700'}`}>{b.title}</h3>
                  <p className={`mt-1.5 text-sm ${b.big ? 'text-navy-200' : 'text-navy-500'}`}>{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Яндекс Карта */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight text-navy-800">
                Работаем по Москве и Московской области
              </h2>

              <p className="mt-2 text-sm text-navy-500">
                Выберите адрес доставки при оформлении заказа — мы подберём
                подходящий бетонный завод.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="overflow-hidden rounded-3xl border border-surface-border shadow-soft">
              <YandexMap plants={plants} headOffice={headOffice} />
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 sm:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-500/25 blur-3xl"
              />
              <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    Готовы оформить заказ?
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm text-navy-200">
                    Укажите материал, объём и адрес — мы найдём подходящий завод и пришлём
                    уведомление, как только он подтвердит заказ.
                  </p>
                </div>
                <Link href="/order/new" className="btn-primary shrink-0">
                  Заказать бетон
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
