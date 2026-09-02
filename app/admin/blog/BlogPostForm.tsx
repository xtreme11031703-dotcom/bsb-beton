'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBlogPost, updateBlogPost } from '@/app/actions/blog-admin';

type PostData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
} | null;

export function BlogPostForm({ post }: { post: PostData }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = post ? await updateBlogPost(post.id, formData) : await createBlogPost(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push('/admin/blog');
        });
      }}
      className="card max-w-2xl space-y-4"
    >
      <div>
        <label className="field-label">Заголовок</label>
        <input name="title" required defaultValue={post?.title} className="field-input" />
      </div>

      <div>
        <label className="field-label">Адрес статьи (slug)</label>
        <input
          name="slug"
          required
          defaultValue={post?.slug}
          placeholder="kak-vybrat-marku-betona"
          className="field-input font-mono text-sm"
        />
        <p className="mt-1 text-xs text-navy-400">
          Латиницей в нижнем регистре, слова через дефис — станет частью адреса страницы:
          bsbbeton.online/blog/…
        </p>
      </div>

      <div>
        <label className="field-label">Краткое описание (для карточки в списке статей)</label>
        <textarea name="excerpt" required rows={2} defaultValue={post?.excerpt} className="field-input" />
      </div>

      <div>
        <label className="field-label">Текст статьи</label>
        <textarea
          name="content"
          required
          rows={16}
          defaultValue={post?.content}
          className="field-input font-mono text-sm"
          placeholder={'## Заголовок раздела\n\nАбзац текста. **Жирный текст**, *курсив*, [ссылка](https://example.com).\n\n- пункт списка\n- ещё пункт'}
        />
        <p className="mt-1 text-xs text-navy-400">
          Простой markdown: заголовки через "## " и "### ", **жирный**, *курсив*, [ссылка](url),
          списки через "- ". Пустая строка — новый абзац.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? true}
          className="h-5 w-5 rounded border-surface-border"
        />
        Опубликована (видна на публичном сайте)
      </label>

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}
