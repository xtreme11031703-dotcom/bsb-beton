import { notFound } from 'next/navigation';
import { getBlogPostAdmin } from '@/app/actions/blog-admin';
import { BlogPostForm } from '../../BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const post = await getBlogPostAdmin(params.id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Редактирование статьи</h1>
      <BlogPostForm post={post} />
    </div>
  );
}
