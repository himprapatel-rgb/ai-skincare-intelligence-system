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
  category?: string;
  read_time?: string;
  created_at?: string;
  image_url?: string;
}

const FALLBACK_POSTS: BlogPost[] = [
  { id: 'fb-1', slug: 'building-morning-routine', title: 'Building a Simple Morning Routine', excerpt: 'Learn how to create a calm, effective AM routine with antioxidants, hydration, and SPF in under five minutes.', read_time: '5 min read', category: 'Routines' },
  { id: 'fb-2', slug: 'ingredient-interactions', title: 'Understanding Ingredient Interactions', excerpt: 'A quick guide to layering actives safely and avoiding common irritation combinations like acids + retinoids.', read_time: '7 min read', category: 'Ingredients' },
  { id: 'fb-3', slug: 'tracking-progress-scans', title: 'Tracking Progress with Weekly Scans', excerpt: 'See why consistent tracking improves results and how to capture better scan images at home.', read_time: '6 min read', category: 'Tips' },
];

const BlogPage: React.FC = () => {
  usePageTitle('Blog');
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK_POSTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/content/blogs`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const items: BlogPost[] = Array.isArray(data) ? data : (data.blogs || data.data || []);
        if (cancelled || items.length === 0) return;
        setPosts(items.map(p => ({
          ...p,
          slug: p.slug || String(p.id),
          excerpt: p.excerpt || '',
          read_time: p.read_time || '5 min read',
        })));
      } catch {
        // Keep fallback posts
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="blog-page app-page">
      <header className="app-header-card">
        <h1>Blog</h1>
        <p className="app-header-subtitle">Tips, routines, and science-backed skincare.</p>
      </header>
      <div className="app-page-content blog-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 120, background: 'var(--bg-tertiary, #eef2f6)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="blog-card">
                <article>
                  {post.category && <span className="blog-category">{post.category}</span>}
                  <h3>{post.title}</h3>
                  <p className="blog-excerpt">{post.excerpt}</p>
                  <div className="blog-meta-row">
                    <span className="blog-meta">{post.read_time}</span>
                    {post.created_at && (
                      <span className="blog-meta">{new Date(post.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
