import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';
import { blogPosts } from '@/lib/blog-posts';

export const metadata = {
  title: `Блог — ${company.fullName}`,
  description: 'Статьи о марках бетона, доставке и работе с бетононасосом.',
};

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
            {blogPosts.map((post, i) => (
              <Reveal key={post.slug} delayMs={(i % 6) * 80}>
                <Link href={`/blog/${post.slug}`} className="block h-full">
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
                    <span className="mt-3 inline-block text-sm font-medium text-accent-600">
                      Читать →
                    </span>
                  </article>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
