import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
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
      <div className="app-page-content blog-post-wrapper">
        <Link to="/blog" className="blog-post-back">
          &larr; Back to Blog
        </Link>

        {post.category && (
          <span className="blog-post-category">{post.category}</span>
        )}

        <h1 className="blog-post-title">{post.title}</h1>

        <div className="blog-post-meta">
          {post.author && <span>By {post.author}</span>}
          {post.created_at && <span>{new Date(post.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          {post.read_time && <span>{post.read_time}</span>}
        </div>

        <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />

        {post.tags && post.tags.length > 0 && (
          <div className="blog-post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="blog-post-tag">
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
