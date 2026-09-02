import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';
import { categorySlugToKey } from '@/lib/catalog';
import { CatalogCategoryGrid } from '@/components/catalog/CatalogCategoryGrid';

export function generateStaticParams() {
  return company.serviceCategories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const serviceCategory = company.serviceCategories.find((c) => c.slug === params.category);
  return {
    title: serviceCategory ? `${serviceCategory.title} — ${company.fullName}` : `Каталог — ${company.fullName}`,
    description: serviceCategory?.description,
  };
}

export default function CatalogCategoryPage({ params }: { params: { category: string } }) {
  const serviceCategory = company.serviceCategories.find((c) => c.slug === params.category);
  const category = categorySlugToKey(params.category);
  if (!serviceCategory || !category) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                {serviceCategory.title}
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">{serviceCategory.description}</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <CatalogCategoryGrid category={category} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
