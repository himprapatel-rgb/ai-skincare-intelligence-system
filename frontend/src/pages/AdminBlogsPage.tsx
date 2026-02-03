import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconPlus, IconEdit2, IconTrash2, IconFileText } from '../components/Icons';
import './AdminBlogsPage.css';

type Blog = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  read_time_min: number;
  published: boolean;
  published_at?: string | null;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

const AdminBlogsPage: React.FC = () => {
  usePageTitle('Admin - Blogs');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    read_time_min: 5,
    published: true,
  });

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/admin/blogs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load blogs');
      const data = await res.json();
      setBlogs(data);
    } catch (e) {
      console.error(e);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const resetForm = () => {
    setForm({ title: '', excerpt: '', content: '', cover_image_url: '', read_time_min: 5, published: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (b: Blog) => {
    setEditing(b);
    setForm({
      title: b.title,
      excerpt: b.excerpt || '',
      content: b.content || '',
      cover_image_url: b.cover_image_url || '',
      read_time_min: b.read_time_min,
      published: b.published,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const url = editing
      ? `${API_BASE_URL}/admin/blogs/${editing.id}`
      : `${API_BASE_URL}/admin/blogs`;
    const body = editing
      ? { title: form.title, excerpt: form.excerpt || null, content: form.content || null, cover_image_url: form.cover_image_url || null, read_time_min: form.read_time_min, published: form.published }
      : { title: form.title, excerpt: form.excerpt || null, content: form.content || null, cover_image_url: form.cover_image_url || null, read_time_min: form.read_time_min, published: form.published };
    try {
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchBlogs();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this blog post?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchBlogs();
      if (editing?.id === id) resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-blogs-page app-page page-container">
      <div className="page-header admin-content-header">
        <div>
          <Link to="/admin" className="back-link">← Admin</Link>
          <h1><IconFileText size={24} /> Manage Blogs</h1>
          <p>Add or edit blog posts. They appear on /blog.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <IconPlus size={18} /> Add Blog
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2>{editing ? 'Edit Blog' : 'New Blog'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="blog-title">Title</label>
              <input id="blog-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="blog-excerpt">Excerpt</label>
              <textarea id="blog-excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="blog-content">Content</label>
              <textarea id="blog-content" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="blog-cover">Cover Image URL</label>
              <input id="blog-cover" type="url" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="blog-read-time">Read time (min)</label>
                <input id="blog-read-time" type="number" min={1} value={form.read_time_min} onChange={(e) => setForm({ ...form, read_time_min: parseInt(e.target.value, 10) || 5 })} />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                  Published
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="admin-loading">Loading blogs...</p>}
      {!loading && blogs.length === 0 && (
        <div className="admin-empty">
          <p>No blogs yet. Click &quot;Add Blog&quot; to create one.</p>
        </div>
      )}
      {!loading && blogs.length > 0 && (
        <div className="admin-list">
          {blogs.map((b) => (
            <div key={b.id} className="admin-list-card">
              <div className="admin-list-body">
                <h3>{b.title}</h3>
                <p className="admin-meta">{b.slug} · {b.read_time_min} min · {b.published ? 'Published' : 'Draft'}</p>
              </div>
              <div className="admin-list-actions">
                <button type="button" className="btn-icon" onClick={() => handleEdit(b)} aria-label="Edit"><IconEdit2 size={18} /></button>
                <button type="button" className="btn-icon danger" onClick={() => handleDelete(b.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogsPage;
