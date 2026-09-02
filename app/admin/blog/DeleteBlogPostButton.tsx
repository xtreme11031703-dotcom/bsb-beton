'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBlogPost } from '@/app/actions/blog-admin';

export function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Удалить статью «${title}»? Это нельзя отменить.`)) return;
        startTransition(async () => {
          await deleteBlogPost(id);
          router.refresh();
        });
      }}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      Удалить
    </button>
  );
}
