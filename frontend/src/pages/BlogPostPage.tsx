import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import './BlogPage.css';

interface BlogPost {
  id: string | number;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  author?: string;
  created_at?: string;
  read_time?: string;
  tags?: string[];
  image_url?: string;
  view_count?: number;
}

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(post?.title || 'Blog Post');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/content/blogs/${id}`);
        if (!res.ok) throw new Error('Blog post not found');
        const data = await res.json();
        if (!cancelled) setPost(data);

        // Track view
        fetch(`${API_BASE_URL}/content/blogs/${id}/view`, { method: 'POST' }).catch(() => {});
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="blog-page app-page">
        <div className="app-page-content" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ height: 32, width: '60%', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 16, width: '100%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 16, width: '90%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 16, width: '75%', background: 'var(--bg-tertiary)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-page app-page">
        <div className="app-page-content" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <h2>{error || 'Post not found'}</h2>
          <Link to="/blog" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page app-page">
      <div className="app-page-content" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <Link to="/blog" style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: 24, display: 'inline-block' }}>
          &larr; Back to Blog
        </Link>

        {post.category && (
          <span style={{
            display: 'inline-block', fontSize: '0.7rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.06)',
            padding: '3px 10px', borderRadius: 4, marginBottom: 12,
          }}>
            {post.category}
          </span>
        )}

        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 32 }}>
          {post.author && <span>By {post.author}</span>}
          {post.created_at && <span>{new Date(post.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          {post.read_time && <span>{post.read_time}</span>}
        </div>

        <div
          className="blog-post-content"
          style={{ fontSize: '1rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: 32, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                background: 'var(--bg-tertiary)', borderRadius: 12, color: 'var(--text-muted)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage;
