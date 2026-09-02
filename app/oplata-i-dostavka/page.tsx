import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';

export const metadata = {
  title: `Оплата и доставка — ${company.fullName}`,
  description: 'Способы оплаты и стоимость доставки бетона по Москве и Московской области.',
};

export default function OplataIDostavkaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Оплата и доставка
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Гибкие способы оплаты и прозрачные тарифы на доставку — точную стоимость видно
                ещё до подтверждения заказа.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Способы оплаты</h2>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {company.paymentMethods.map((method, i) => (
              <Reveal key={method} delayMs={i * 90}>
                <div className="card h-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
                    {i + 1}
                  </div>
                  <p className="mt-3 text-sm font-medium text-navy-700">{method}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-navy-700">Стоимость доставки по Москве</h2>
            <p className="mt-2 max-w-2xl text-sm text-navy-500">
              Тариф зависит от расстояния от МКАД до адреса объекта. Для Московской области
              стоимость уточняется индивидуально при оформлении заявки — смотрите также страницу{' '}
              <Link href="/dostavka-po-mo" className="font-medium text-navy-800 underline underline-offset-2">
                «Доставка по Московской области»
              </Link>
              .
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="card mt-6 overflow-hidden !p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted text-navy-600">
                    <th className="px-5 py-3 font-semibold">Расстояние от МКАД</th>
                    <th className="px-5 py-3 font-semibold">Стоимость подачи</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {company.deliveryRates.map((rate) => (
                    <tr key={rate.distance}>
                      <td className="px-5 py-3.5 text-navy-700">{rate.distance}</td>
                      <td className="px-5 py-3.5 font-medium text-navy-800">{rate.price} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="mt-4 text-xs text-navy-400">
              Указана стоимость подачи автобетоносмесителя. Итоговая цена заказа складывается из
              стоимости материала и доставки и отображается перед подтверждением заявки.
            </p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Готовы оформить заказ?</h2>
                <p className="mt-1 text-sm text-navy-200">
                  Укажите адрес — мы рассчитаем точную стоимость доставки автоматически.
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
