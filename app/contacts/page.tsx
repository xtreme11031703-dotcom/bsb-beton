import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import YandexMap from '@/components/YandexMap';
import { company } from '@/lib/company';

export const metadata = {
  title: `Контакты — ${company.fullName}`,
  description: 'Телефон, email и адреса заводов БСБ в Москве и Московской области.',
};

export default function ContactsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Контакты
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">{company.workHours}</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Reveal>
              <div className="card h-full">
                <h3 className="text-sm font-semibold text-navy-500">Телефон</h3>
                <a href={company.phoneHref} className="mt-1 block text-xl font-bold text-navy-800">
                  {company.phone}
                </a>
              </div>
            </Reveal>
            <Reveal delayMs={80}>
              <div className="card h-full">
                <h3 className="text-sm font-semibold text-navy-500">Email</h3>
                <a href={`mailto:${company.email}`} className="mt-1 block text-xl font-bold text-navy-800">
                  {company.email}
                </a>
              </div>
            </Reveal>
            <Reveal delayMs={160}>
              <div className="card h-full">
                <h3 className="text-sm font-semibold text-navy-500">Режим работы</h3>
                <p className="mt-1 text-xl font-bold text-navy-800">{company.workHours}</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Заводы и филиалы</h2>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.branches.map((b, i) => (
              <Reveal key={b.name} delayMs={(i % 6) * 60}>
                <div className="card h-full">
                  <h3 className="font-semibold text-navy-700">{b.name}</h3>
                  <p className="mt-1 text-sm text-navy-500">{b.address}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <h2 className="mb-5 text-2xl font-bold text-navy-700">Зона доставки</h2>
          </Reveal>
          <div className="overflow-hidden rounded-2xl border border-surface-border shadow-sm">
            <YandexMap />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
