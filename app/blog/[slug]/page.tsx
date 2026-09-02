import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';
import { blogPosts, getBlogPost } from '@/lib/blog-posts';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: `Блог — ${company.fullName}` };
  return {
    title: `${post.title} — ${company.fullName}`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const otherPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-navy-700">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal>
              <Link href="/blog" className="text-sm text-navy-200 hover:text-white hover:underline">
                ← Все статьи
              </Link>
              <time className="mt-4 block text-sm text-navy-300">
                {new Date(post.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-lg text-navy-100">{post.excerpt}</p>
            </Reveal>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          {post.sections.map((section, i) => (
            <Reveal key={i} delayMs={i * 60}>
              <div className="mb-8">
                {section.heading && (
                  <h2 className="mb-3 text-xl font-bold text-navy-800">{section.heading}</h2>
                )}
                <div className="space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-base leading-relaxed text-navy-600">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal>
            <div className="card mt-10 flex flex-col items-start justify-between gap-4 bg-navy-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Готовы оформить заказ?</h2>
                <p className="mt-1 text-sm text-navy-200">
                  Укажите материал, объём и адрес — мы найдём подходящий завод.
                </p>
              </div>
              <Link href="/order/new" className="btn-primary shrink-0">
                Заказать бетон
              </Link>
            </div>
          </Reveal>
        </article>

        {otherPosts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <Reveal>
              <h2 className="mb-5 text-xl font-bold text-navy-800">Читайте также</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {otherPosts.map((p, i) => (
                <Reveal key={p.slug} delayMs={i * 80}>
                  <Link href={`/blog/${p.slug}`} className="block h-full">
                    <article className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
                      <h3 className="font-semibold text-navy-700">{p.title}</h3>
                      <p className="mt-1.5 text-sm text-navy-500">{p.excerpt}</p>
                    </article>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
