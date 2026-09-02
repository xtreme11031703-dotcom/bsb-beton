'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Требуются права администратора');
  return session;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function listBlogPostsAdmin() {
  await requireAdmin();
  return prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });
}

export async function getBlogPostAdmin(id: string) {
  await requireAdmin();
  return prisma.blogPost.findUnique({ where: { id } });
}

// Slug латиницей в нижнем регистре, через дефис — как у уже перенесённых
// статей (см. lib/blog-posts.ts) и как того требует ЧПУ-адрес /blog/[slug].
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const postSchema = z.object({
  title: z.string().trim().min(3, 'Укажите заголовок'),
  slug: z
    .string()
    .trim()
    .min(3, 'Укажите адрес статьи (slug)')
    .regex(SLUG_PATTERN, 'Адрес — латиницей в нижнем регистре, слова через дефис, например: kak-vybrat-marku-betona'),
  excerpt: z.string().trim().min(3, 'Укажите краткое описание для карточки статьи'),
  content: z.string().trim().min(3, 'Укажите текст статьи'),
  published: z.boolean(),
});

function parsePostForm(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    published: formData.get('published') === 'on',
  });
}

export async function createBlogPost(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parsePostForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { ok: false, error: 'Статья с таким адресом (slug) уже существует' };

  await prisma.blogPost.create({ data: parsed.data });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true };
}

export async function updateBlogPost(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parsePostForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const bySlug = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (bySlug && bySlug.id !== id) return { ok: false, error: 'Статья с таким адресом (slug) уже существует' };

  const previous = await prisma.blogPost.findUnique({ where: { id } });
  await prisma.blogPost.update({ where: { id }, data: parsed.data });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${parsed.data.slug}`);
  // Если поменяли slug — старый адрес статьи теперь должен вести на 404,
  // сбрасываем кеш и для него тоже.
  if (previous && previous.slug !== parsed.data.slug) revalidatePath(`/blog/${previous.slug}`);
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  if (post) revalidatePath(`/blog/${post.slug}`);
  return { ok: true };
}
