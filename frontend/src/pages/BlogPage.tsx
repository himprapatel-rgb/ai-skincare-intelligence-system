import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import './BlogPage.css';

interface BlogPost {
  id: string | number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category?: string;
  tags?: string[];
  read_time_min?: number;
  view_count?: number;
  created_at?: string;
  cover_image_url?: string;
}

const BlogPage: React.FC = () => {
  usePageTitle('Blog — Pellicura');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/content/blogs?limit=20`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || data.blogs || [];
        if (!cancelled && items.length > 0) {
          setPosts(items.map((p: any) => ({
            id: p.id,
            slug: p.slug || `post-${p.id}`,
            title: p.title || 'Untitled',
            excerpt: p.excerpt || '',
            content: p.content || '',
            category: p.category || 'Skincare',
            tags: p.tags || [],
            read_time_min: p.read_time_min || 5,
            view_count: p.view_count || 0,
            created_at: p.created_at || p.published_at,
            cover_image_url: p.cover_image_url,
          })));
        }
      } catch {
        // Keep empty — will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  const featured = posts[0];
  const remaining = posts.slice(1);
  const sidebarPosts = remaining.slice(0, 4);
  const gridPosts = remaining.slice(4);

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-header">
          <h1>Blog</h1>
          <p>Tips, routines, and science-backed skincare insights.</p>
        </div>
        <div className="blog-skeleton-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="blog-skeleton-card">
              <div className="blog-skeleton-image skeleton-pulse" />
              <div className="blog-skeleton-body">
                <div className="skeleton-pulse" style={{ height: 16, width: '40%', borderRadius: 8 }} />
                <div className="skeleton-pulse" style={{ height: 20, width: '90%', borderRadius: 8, marginTop: 12 }} />
                <div className="skeleton-pulse" style={{ height: 14, width: '70%', borderRadius: 8, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="blog-page">
        <div className="blog-header">
          <h1>Blog</h1>
          <p>Tips, routines, and science-backed skincare insights.</p>
        </div>
        <div className="blog-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h3>No articles yet</h3>
          <p>Check back soon for skincare tips and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      {/* Header */}
      <div className="blog-header">
        <span className="blog-header-tag">Pellicura Blog</span>
        <h1>Skincare Insights</h1>
        <p>Science-backed tips, routines, and ingredient guides — powered by real skin data.</p>
      </div>

      {/* Featured + Sidebar layout */}
      <div className="blog-featured-row">
        {/* Featured latest post — big hero */}
        {featured && (
          <Link to={`/blog/${featured.slug || featured.id}`} className="blog-featured-card">
            <div className="blog-featured-image">
              {featured.cover_image_url ? (
                <img src={featured.cover_image_url} alt={featured.title} loading="lazy" />
              ) : (
                <div className="blog-featured-placeholder" />
              )}
              <div className="blog-featured-overlay" />
            </div>
            <div className="blog-featured-content">
              {featured.category && <span className="blog-category">{featured.category}</span>}
              <h2 className="blog-featured-title">{featured.title}</h2>
              <p className="blog-featured-excerpt">{featured.excerpt}</p>
              <div className="blog-meta-row">
                {featured.read_time_min && <span className="blog-meta">{featured.read_time_min} min read</span>}
                {featured.created_at && <span className="blog-meta">{formatDate(featured.created_at)}</span>}
              </div>
            </div>
          </Link>
        )}

        {/* Sidebar: older posts with small thumbnails */}
        {sidebarPosts.length > 0 && (
          <aside className="blog-sidebar">
            <h3 className="blog-sidebar-title">Recent Articles</h3>
            {sidebarPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="blog-sidebar-item">
                <div className="blog-sidebar-thumb">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="blog-sidebar-placeholder" />
                  )}
                </div>
                <div className="blog-sidebar-text">
                  {post.category && <span className="blog-category blog-category--sm">{post.category}</span>}
                  <h4>{post.title}</h4>
                  <span className="blog-meta">{post.read_time_min || 5} min · {formatDate(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </aside>
        )}
      </div>

      {/* Grid: remaining posts */}
      {gridPosts.length > 0 && (
        <>
          <div className="blog-section-divider" />
          <h3 className="blog-section-title">More Articles</h3>
          <div className="blog-grid">
            {gridPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="blog-card">
                <div className="blog-card-image">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="blog-card-placeholder" />
                  )}
                </div>
                <div className="blog-card-body">
                  {post.category && <span className="blog-category">{post.category}</span>}
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-meta-row">
                    <span className="blog-meta">{post.read_time_min || 5} min read</span>
                    <span className="blog-meta">{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BlogPage;
