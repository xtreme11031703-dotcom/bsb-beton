import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import YandexMap from '@/components/YandexMap';
import { company } from '@/lib/company';
import { getPublicPlantLocations } from '@/app/actions/plants';
import { geocodeAddress } from '@/lib/yandex-geocoder';

export const metadata = {
  title: `Доставка бетона по Московской области — ${company.fullName}`,
  description: 'Доставляем товарный бетон и растворы в города Московской области с ближайшего завода.',
};

export default async function DostavkaPoMoPage() {
  const plants = await getPublicPlantLocations();

  const headOfficeBranch = company.branches.find((b) => b.name === 'Главный офис');
  const headOfficeGeocoded =
    headOfficeBranch && (headOfficeBranch.address as string) !== 'уточняется'
      ? await geocodeAddress(headOfficeBranch.address, 60 * 60 * 24).catch(() => null)
      : null;
  const headOffice = headOfficeGeocoded
    ? { name: headOfficeBranch!.name, latitude: headOfficeGeocoded.latitude, longitude: headOfficeGeocoded.longitude }
    : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Доставка бетона по Московской области
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Сеть заводов {company.fullName} расположена по всей области — заказ автоматически
                уходит на завод, ближайший к вашему объекту, что сокращает время подачи и
                стоимость доставки.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Как это работает</h2>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Указываете адрес',
                text: 'При оформлении заказа отмечаете точку доставки на карте — в черте города или на участке.',
              },
              {
                title: 'Подбираем завод',
                text: 'Система находит ближайший завод из сети, который готов взять заказ на нужное время.',
              },
              {
                title: 'Везём точно в срок',
                text: 'Автобетоносмеситель выезжает по графику — среднее время в области зависит от расстояния до объекта.',
              },
            ].map((step, i) => (
              <Reveal key={step.title} delayMs={i * 100}>
                <div className="card h-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 text-sm font-bold text-accent-600">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 font-semibold text-navy-700">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Города, куда мы доставляем</h2>
            <p className="mt-2 max-w-2xl text-sm text-navy-500">
              Регулярно возим бетон и растворы в следующие города и районы Московской области.
              Если вашего города нет в списке — уточните возможность доставки по телефону,
              скорее всего мы уже туда работаем.
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="mt-6 flex flex-wrap gap-2">
              {company.deliveryTowns.map((town) => (
                <span
                  key={town}
                  className="rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-soft"
                >
                  {town}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-navy-700">Заводы в области</h2>
              <p className="mt-2 text-sm text-navy-500">
                Полный список заводов и офисов — на странице{' '}
                <Link href="/contacts" className="font-medium text-navy-800 underline underline-offset-2">
                  «Контакты»
                </Link>
                .
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
            <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Не нашли свой город?</h2>
                <p className="mt-1 text-sm text-navy-200">
                  Позвоните нам — уточним ближайший завод и стоимость доставки на ваш адрес.
                </p>
              </div>
              <a href={company.phoneHref} className="btn-primary shrink-0">
                {company.phone}
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
