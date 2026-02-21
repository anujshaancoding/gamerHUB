import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-text mb-4">Post Not Found</h1>
      <p className="text-text-muted mb-8">
        This blog post may have been removed or the URL is incorrect.
      </p>
      <Link
        href="/blog"
        className="inline-block px-5 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
      >
        Browse all articles
      </Link>
    </div>
  );
}
