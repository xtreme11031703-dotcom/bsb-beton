import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';

export const metadata = {
  title: `Сертификаты — ${company.fullName}`,
  description: 'Декларации соответствия ГОСТ на товарный бетон и растворные смеси.',
};

export default function SertifikatyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Сертификаты и декларации
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Вся продукция сопровождается действующими декларациями соответствия ГОСТ. На
                каждую партию дополнительно выдаётся паспорт качества.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {company.certificates.map((cert, i) => (
              <Reveal key={cert.title} delayMs={i * 120}>
                <div className="card h-full !p-0 overflow-hidden">
                  <div className="relative aspect-[3/4] w-full bg-surface-muted">
                    <Image
                      src={cert.image}
                      alt={cert.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 480px"
                    />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-navy-700">{cert.title}</h2>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-navy-500">Номер</dt>
                        <dd className="text-right font-medium text-navy-800">{cert.number}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="shrink-0 text-navy-500">Стандарт</dt>
                        <dd className="text-right font-medium text-navy-800">{cert.standard}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-navy-500">Срок действия</dt>
                        <dd className="text-right font-medium text-navy-800">{cert.validity}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delayMs={260}>
            <p className="mt-8 max-w-2xl text-sm text-navy-500">
              Оригиналы документов и паспорт качества на конкретную партию предоставляются вместе
              с поставкой или по запросу — свяжитесь с нами по телефону{' '}
              <a href={company.phoneHref} className="font-medium text-navy-800 underline underline-offset-2">
                {company.phone}
              </a>
              .
            </p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Готовы оформить заказ?</h2>
                <p className="mt-1 text-sm text-navy-200">
                  Каждая поставка сопровождается документами о качестве.
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
