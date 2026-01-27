import React from 'react';
import './BlogPage.css';

const BlogPage: React.FC = () => {
  return (
    <div className="blog-page">
      <div className="blog-container">
        <div className="page-header">
          <h1>SkinCareAI Blog</h1>
          <p>Skincare tips, routines, and science-backed insights.</p>
        </div>

        <div className="blog-grid">
          <article className="blog-card">
            <h3>Building a Simple Morning Routine</h3>
            <p>
              Learn how to create a calm, effective AM routine with antioxidants,
              hydration, and SPF in under five minutes.
            </p>
            <span className="blog-meta">5 min read</span>
          </article>
          <article className="blog-card">
            <h3>Understanding Ingredient Interactions</h3>
            <p>
              A quick guide to layering actives safely and avoiding common irritation
              combinations like acids + retinoids.
            </p>
            <span className="blog-meta">7 min read</span>
          </article>
          <article className="blog-card">
            <h3>Tracking Progress with Weekly Scans</h3>
            <p>
              See why consistent tracking improves results and how to capture
              better scan images at home.
            </p>
            <span className="blog-meta">6 min read</span>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
