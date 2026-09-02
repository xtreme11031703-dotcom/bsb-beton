import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';

export const metadata = {
  title: `Вопросы и ответы — ${company.fullName}`,
  description: 'Ответы на частые вопросы о заказе, оплате и доставке бетона.',
};

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Вопросы и ответы
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Собрали ответы на вопросы, которые чаще всего задают перед заказом бетона.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-3">
            {company.faq.map((item, i) => (
              <Reveal key={item.question} delayMs={i * 60}>
                <details className="group card cursor-pointer !p-0 open:shadow-lift">
                  <summary className="flex list-none items-center justify-between gap-4 px-5 py-4 font-medium text-navy-800 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="shrink-0 text-navy-400 transition-transform duration-150 group-open:rotate-180"
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-navy-500">{item.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Не нашли ответ?</h2>
                <p className="mt-1 text-sm text-navy-200">Напишите нашему боту в Telegram или позвоните напрямую.</p>
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
