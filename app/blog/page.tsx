import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';

export const metadata = {
  title: `Блог — ${company.fullName}`,
  description: 'Статьи о марках бетона, доставке и работе с бетононасосом.',
};

// Черновой набор статей — контент реального блога с bsb-beton.ru не удалось
// автоматически выгрузить (страница блога отдаёт редирект без содержимого).
// Замени эти карточки на реальные статьи, когда пришлёшь тексты.
const posts = [
  {
    title: 'Как выбрать марку бетона под задачу',
    excerpt:
      'М100–М500: чем отличаются марки бетона по прочности и для каких конструкций подходит каждая — фундамент, стяжка, плита перекрытия или дорожное покрытие.',
    date: '2026-08-01',
  },
  {
    title: 'Когда нужен автобетононасос, а когда достаточно миксера',
    excerpt:
      'Разбираем, в каких случаях подача бетона насосом экономит время и деньги на объекте, а в каких хватит обычной доставки миксером.',
    date: '2026-07-18',
  },
  {
    title: 'Уход за бетоном после заливки: первые 28 дней',
    excerpt:
      'Что влияет на набор прочности бетона после заливки: температура, влажность, укрытие поверхности и график контроля.',
    date: '2026-07-02',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                Блог
              </h1>
              <p className="mt-4 max-w-xl text-lg text-navy-100">
                Полезное о бетоне, доставке и работе на объекте.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.title} delayMs={i * 100}>
                <article className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <time className="text-xs text-navy-400">
                    {new Date(post.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <h3 className="mt-2 font-semibold text-navy-700">{post.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{post.excerpt}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
