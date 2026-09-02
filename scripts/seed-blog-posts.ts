// Переносит статьи блога из старого захардкоженного списка (lib/blog-posts.ts,
// формат BlogSection[] — heading + paragraphs) в таблицу BlogPost как обычный
// markdown-текст (см. lib/markdown.ts — им теперь рендерятся статьи и на
// публичной странице, и в админке). Нужно запустить ОДИН РАЗ после
// `prisma db push`.
//
// Идемпотентен по slug: если статья с таким slug уже есть в базе (например,
// админ её уже отредактировал), она НЕ перезаписывается.
import { loadEnv } from './load-env';
loadEnv();

import { PrismaClient } from '@prisma/client';
import { blogPosts, type BlogSection } from '../lib/blog-posts';

const prisma = new PrismaClient();

function sectionsToMarkdown(sections: BlogSection[]): string {
  return sections
    .map((section) => {
      const parts: string[] = [];
      if (section.heading) parts.push(`## ${section.heading}`);
      parts.push(...section.paragraphs);
      return parts.join('\n\n');
    })
    .join('\n\n');
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: sectionsToMarkdown(post.sections),
        published: true,
        publishedAt: new Date(post.date),
      },
    });
    created++;
  }

  console.log(`Готово: перенесено статей — ${created}, уже существовало (пропущено) — ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
