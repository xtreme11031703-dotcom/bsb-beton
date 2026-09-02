import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { PhotoHero } from '@/components/PhotoHero';
import { company } from '@/lib/company';
import { CATEGORY_PHOTOS, PLANT_PHOTO } from '@/lib/category-photos';
import { LayersIcon, MapPinIcon, ShieldCheckIcon, ThermalIcon, PumpIcon } from '@/components/icons';

const categoryIcons: Record<string, typeof LayersIcon> = {
  beton: LayersIcon,
  'toshchiy-beton': MapPinIcon,
  'vysokoprochnyy-beton': ShieldCheckIcon,
  polistirolbeton: ThermalIcon,
  rastvory: LayersIcon,
  'arenda-betononasosa': PumpIcon,
};

export const metadata = {
  title: `Каталог товаров — ${company.fullName}`,
  description: 'Товарный бетон, растворы и аренда бетононасоса — марки, характеристики и цены за м³.',
};

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <PhotoHero imageUrl={PLANT_PHOTO.url} imageAlt={PLANT_PHOTO.alt}>
          <Reveal>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              Каталог товаров
            </h1>
            <p className="mt-4 max-w-xl text-lg text-navy-100">
              Выберите категорию, соберите нужные позиции в корзину — оформить заказ можно сразу
              на несколько разных товаров.
            </p>
          </Reveal>
        </PhotoHero>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.serviceCategories.map((cat, i) => {
              const Icon = categoryIcons[cat.slug] ?? LayersIcon;
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
                      <span className="mt-3 inline-block text-sm font-medium text-accent-600">
                        Смотреть товары →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
