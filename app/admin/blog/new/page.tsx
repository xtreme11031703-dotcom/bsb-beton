import { BlogPostForm } from '../BlogPostForm';

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Новая статья</h1>
      <BlogPostForm post={null} />
    </div>
  );
}
