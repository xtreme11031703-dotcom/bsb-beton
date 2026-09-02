import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { PhotoHero } from '@/components/PhotoHero';
import { company } from '@/lib/company';
import { CATEGORY_PHOTOS, CONSTRUCTION_SITE_PHOTO } from '@/lib/category-photos';
import { LayersIcon, MapPinIcon, ShieldCheckIcon, ThermalIcon, PumpIcon } from '@/components/icons';

const serviceIcons: Record<string, typeof LayersIcon> = {
  beton: LayersIcon,
  'toshchiy-beton': MapPinIcon,
  'vysokoprochnyy-beton': ShieldCheckIcon,
  polistirolbeton: ThermalIcon,
  rastvory: LayersIcon,
  'arenda-betononasosa': PumpIcon,
};

export const metadata = {
  title: `Услуги и цены — ${company.fullName}`,
  description: 'Товарный бетон, растворы и аренда бетононасоса с доставкой по Москве и МО.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <PhotoHero imageUrl={CONSTRUCTION_SITE_PHOTO.url} imageAlt={CONSTRUCTION_SITE_PHOTO.alt}>
          <Reveal>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              Услуги и цены
            </h1>
            <p className="mt-4 max-w-xl text-lg text-navy-100">
              Производим и доставляем бетон, растворы и обеспечиваем подачу бетононасосом.
              Точную стоимость под ваш объём и адрес рассчитаем при оформлении заявки.
            </p>
          </Reveal>
        </PhotoHero>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.serviceCategories.map((cat, i) => {
              const Icon = serviceIcons[cat.slug] ?? LayersIcon;
              const photo = CATEGORY_PHOTOS[cat.slug];
              return (
              <Reveal key={cat.slug} delayMs={i * 80}>
                <Link href={`/catalog/${cat.slug}`} className="block h-full">
                  <div className="card overflow-hidden flex h-full flex-col transition-transform hover:-translate-y-1 hover:shadow-lg">
                    {photo && (
                      <div className="-mx-5 -mt-5 mb-4 aspect-[16/10] overflow-hidden bg-surface-muted">
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-navy-700">{cat.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-navy-500">{cat.description}</p>

                    {'grades' in cat && cat.grades && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {cat.grades.map((g) => (
                          <span
                            key={g}
                            className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-medium text-navy-600"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {'applications' in cat && cat.applications && (
                      <ul className="mt-3 space-y-1 text-xs text-navy-400">
                        {cat.applications.map((a) => (
                          <li key={a}>— {a}</li>
                        ))}
                      </ul>
                    )}

                    <span className="mt-3 inline-block text-sm font-medium text-accent-600">Смотреть цены →</span>
                  </div>
                </Link>
              </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <div className="card bg-surface-muted">
              <h2 className="text-lg font-semibold text-navy-700">Как формируется цена</h2>
              <p className="mt-2 text-sm text-navy-500">
                Стоимость зависит от марки бетона, объёма заказа, дальности доставки и
                необходимости в бетононасосе. У постоянных клиентов — скидки до 20%, а базовые
                цены в среднем ниже рыночных на 30%. Итоговую сумму вы увидите перед
                подтверждением заказа в форме.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Рассчитайте свой заказ</h2>
              <p className="mt-1 text-sm text-navy-200">
                Выберите материал, марку и объём — точную цену увидите сразу в форме заказа.
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
