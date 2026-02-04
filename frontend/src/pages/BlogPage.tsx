import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import './BlogPage.css';

/** Placeholder slugs until individual blog post pages exist. Replace with real routes when ready. */
const BLOG_POSTS = [
  { slug: 'building-morning-routine', title: 'Building a Simple Morning Routine', excerpt: 'Learn how to create a calm, effective AM routine with antioxidants, hydration, and SPF in under five minutes.', readTime: '5 min read' },
  { slug: 'ingredient-interactions', title: 'Understanding Ingredient Interactions', excerpt: 'A quick guide to layering actives safely and avoiding common irritation combinations like acids + retinoids.', readTime: '7 min read' },
  { slug: 'tracking-progress-scans', title: 'Tracking Progress with Weekly Scans', excerpt: 'See why consistent tracking improves results and how to capture better scan images at home.', readTime: '6 min read' },
];

const BlogPage: React.FC = () => {
  usePageTitle('Blog');
  return (
    <div className="blog-page app-page">
      <header className="app-header-card">
        <h1>Blog</h1>
        <p className="app-header-subtitle">Tips, routines, and science-backed skincare.</p>
      </header>
      <div className="app-page-content blog-container">
        <div className="blog-grid">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} to={`/blog#${post.slug}`} className="blog-card" id={post.slug}>
              <article>
                <h3>{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <span className="blog-meta" aria-label={`${post.readTime} read`}>{post.readTime}</span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
