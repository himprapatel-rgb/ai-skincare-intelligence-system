import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import './BlogPage.css';

interface BlogPost {
  id: string | number;
  slug?: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  read_time_min?: number;
  view_count?: number;
  created_at?: string;
  cover_image_url?: string;
}

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  usePageTitle(post ? `${post.title} — Pellicura Blog` : 'Blog — Pellicura');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        // Try slug-based lookup first, then numeric ID
        const isNumeric = /^\d+$/.test(id);
        let res: Response;
        if (isNumeric) {
          res = await fetch(`${API_BASE_URL}/content/blogs/${id}`);
        } else {
          // Try by slug
          res = await fetch(`${API_BASE_URL}/content/blogs/by-slug/${encodeURIComponent(id)}`);
          // If slug fails, try as numeric ID anyway
          if (!res.ok) {
            res = await fetch(`${API_BASE_URL}/content/blogs/${id}`);
          }
        }

        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const blogId = data.id; // Always use numeric ID from response

        if (!cancelled) {
          setPost({
            id: blogId,
            title: data.title || 'Untitled',
            content: data.content || '',
            excerpt: data.excerpt || '',
            category: data.category || 'Skincare',
            tags: data.tags || [],
            read_time_min: data.read_time_min || 5,
            view_count: data.view_count || 0,
            created_at: data.created_at || data.published_at,
            cover_image_url: data.cover_image_url,
          });
        }

        // Track view using numeric ID
        fetch(`${API_BASE_URL}/content/blogs/${blogId}/view`, { method: 'POST' }).catch(() => {});

        // Fetch related posts
        try {
          const relRes = await fetch(`${API_BASE_URL}/content/blogs?limit=4`);
          if (relRes.ok) {
            const relData = await relRes.json();
            const items = Array.isArray(relData) ? relData : relData.data || [];
            if (!cancelled) {
              setRelatedPosts(
                items
                  .filter((p: any) => String(p.id) !== String(blogId))
                  .slice(0, 3)
                  .map((p: any) => ({
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    content: '',
                    excerpt: p.excerpt || '',
                    category: p.category,
                    read_time_min: p.read_time_min || 5,
                    created_at: p.created_at,
                    cover_image_url: p.cover_image_url,
                  }))
              );
            }
          }
        } catch {}
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blogpost-loading">
          <div className="skeleton-pulse" style={{ height: 320, borderRadius: 16 }} />
          <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 24px' }}>
            <div className="skeleton-pulse" style={{ height: 32, width: '60%', borderRadius: 8, marginBottom: 16 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: '100%', borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: '90%', borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: '75%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-page">
        <div className="blog-empty">
          <h3>Article not found</h3>
          <p>This article may have been removed or the link is incorrect.</p>
          <Link to="/blog" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page blogpost-page">
      {/* Back link */}
      <div className="blogpost-nav">
        <Link to="/blog" className="blogpost-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All Articles
        </Link>
      </div>

      {/* Hero cover image */}
      {post.cover_image_url && (
        <div className="blogpost-hero">
          <img src={post.cover_image_url} alt={post.title} loading="lazy" />
          <div className="blogpost-hero-overlay" />
        </div>
      )}

      {/* Article content */}
      <article className="blogpost-article">
        {/* Meta header */}
        <div className="blogpost-meta-header">
          {post.category && <span className="blog-category">{post.category}</span>}
          <div className="blog-meta-row">
            {post.read_time_min && <span className="blog-meta">{post.read_time_min} min read</span>}
            {post.created_at && <span className="blog-meta">{formatDate(post.created_at)}</span>}
            {post.view_count ? <span className="blog-meta">{post.view_count} views</span> : null}
          </div>
        </div>

        {/* Title */}
        <h1 className="blogpost-title">{post.title}</h1>

        {/* Excerpt as lead paragraph */}
        {post.excerpt && (
          <p className="blogpost-lead">{post.excerpt}</p>
        )}

        {/* Article body */}
        <div
          className="blogpost-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="blogpost-tags">
            {post.tags.map((tag, i) => (
              <span key={i} className="blogpost-tag">{tag}</span>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="blogpost-related">
          <h3 className="blog-section-title">More Articles</h3>
          <div className="blog-grid">
            {relatedPosts.map((rp) => (
              <Link key={rp.id} to={`/blog/${rp.slug || rp.id}`} className="blog-card">
                <div className="blog-card-image">
                  {rp.cover_image_url ? (
                    <img src={rp.cover_image_url} alt={rp.title} loading="lazy" />
                  ) : (
                    <div className="blog-card-placeholder" />
                  )}
                </div>
                <div className="blog-card-body">
                  {rp.category && <span className="blog-category">{rp.category}</span>}
                  <h3 className="blog-card-title">{rp.title}</h3>
                  <p className="blog-card-excerpt">{rp.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
