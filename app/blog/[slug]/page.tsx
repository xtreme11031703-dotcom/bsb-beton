import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { company } from '@/lib/company';
import { prisma } from '@/lib/prisma';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

// cache() дедуплицирует запрос между generateMetadata и самим компонентом
// страницы — оба вызываются для одного и того же рендера.
const getPostBySlug = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({ where: { slug } });
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post || !post.published) return { title: `Блог — ${company.fullName}` };
  return {
    title: `${post.title} — ${company.fullName}`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post || !post.published) notFound();

  const otherPosts = await prisma.blogPost.findMany({
    where: { published: true, slug: { not: post.slug } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  const contentHtml = renderMarkdown(post.content);

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
                {post.publishedAt.toLocaleDateString('ru-RU', {
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
          <Reveal>
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </Reveal>

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
