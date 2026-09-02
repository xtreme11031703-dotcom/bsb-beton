import Link from 'next/link';
import { listBlogPostsAdmin } from '@/app/actions/blog-admin';
import { DeleteBlogPostButton } from './DeleteBlogPostButton';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">Блог</h1>
        <Link href="/admin/blog/new" className="btn-primary !px-4 !py-2.5 text-sm">
          Добавить статью
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center text-sm text-navy-400">Пока нет ни одной статьи.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="card flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-navy-800">{post.title}</h3>
                  {!post.published && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Черновик
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-navy-400">/blog/{post.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-surface-muted"
                >
                  Редактировать
                </Link>
                <DeleteBlogPostButton id={post.id} title={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
