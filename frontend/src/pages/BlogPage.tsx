import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import './BlogPage.css';

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
          <article className="blog-card">
            <h3>Building a Simple Morning Routine</h3>
            <p className="blog-excerpt">
              Learn how to create a calm, effective AM routine with antioxidants,
              hydration, and SPF in under five minutes.
            </p>
            <span className="blog-meta" aria-label="5 minute read">5 min read</span>
          </article>
          <article className="blog-card">
            <h3>Understanding Ingredient Interactions</h3>
            <p className="blog-excerpt">
              A quick guide to layering actives safely and avoiding common irritation
              combinations like acids + retinoids.
            </p>
            <span className="blog-meta" aria-label="7 minute read">7 min read</span>
          </article>
          <article className="blog-card">
            <h3>Tracking Progress with Weekly Scans</h3>
            <p className="blog-excerpt">
              See why consistent tracking improves results and how to capture
              better scan images at home.
            </p>
            <span className="blog-meta" aria-label="6 minute read">6 min read</span>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
