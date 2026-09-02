import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';
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
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Каталог товаров
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Выберите категорию, соберите нужные позиции в корзину — оформить заказ можно сразу
                на несколько разных товаров.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.serviceCategories.map((cat, i) => {
              const Icon = categoryIcons[cat.slug] ?? LayersIcon;
              return (
                <Reveal key={cat.slug} delayMs={i * 80}>
                  <Link href={`/catalog/${cat.slug}`} className="block h-full">
                    <div className="card flex h-full flex-col transition-transform hover:-translate-y-1 hover:shadow-lg">
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
