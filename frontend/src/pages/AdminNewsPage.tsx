import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconPlus, IconEdit2, IconTrash2, IconNewspaper } from '../components/Icons';
import './AdminNewsPage.css';

type NewsItem = {
  id: number;
  title: string;
  body?: string | null;
  link_url?: string | null;
  is_featured: boolean;
  published: boolean;
  published_at?: string | null;
  sort_order: number;
  created_at?: string | null;
};

const AdminNewsPage: React.FC = () => {
  usePageTitle('Admin - News');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    link_url: '',
    is_featured: false,
    published: true,
  });

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/admin/news`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load news');
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.error(e);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const resetForm = () => {
    setForm({ title: '', body: '', link_url: '', is_featured: false, published: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (n: NewsItem) => {
    setEditing(n);
    setForm({
      title: n.title,
      body: n.body || '',
      link_url: n.link_url || '',
      is_featured: n.is_featured,
      published: n.published,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const payload = {
      title: form.title,
      body: form.body || null,
      link_url: form.link_url || null,
      is_featured: form.is_featured,
      published: form.published,
    };
    const url = editing ? `${API_BASE_URL}/admin/news/${editing.id}` : `${API_BASE_URL}/admin/news`;
    try {
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchNews();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this news item?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchNews();
      if (editing?.id === id) resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-news-page page-container">
      <div className="page-header admin-content-header">
        <div>
          <Link to="/admin" className="back-link">← Admin</Link>
          <h1><IconNewspaper size={24} /> Manage News</h1>
          <p>Add or edit news items. Can appear on homepage.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <IconPlus size={18} /> Add News
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2>{editing ? 'Edit News' : 'New News'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="news-title">Title</label>
              <input id="news-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="news-body">Body</label>
              <textarea id="news-body" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="news-link">Link URL</label>
              <input id="news-link" type="url" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group checkbox-row">
              <label>
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                Featured
              </label>
              <label>
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                Published
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="admin-loading">Loading news...</p>}
      {!loading && news.length === 0 && (
        <div className="admin-empty">
          <p>No news yet. Click &quot;Add News&quot; to create one.</p>
        </div>
      )}
      {!loading && news.length > 0 && (
        <div className="admin-list">
          {news.map((n) => (
            <div key={n.id} className="admin-list-card">
              <div className="admin-list-body">
                <h3>{n.title} {n.is_featured && <span className="badge">Featured</span>}</h3>
                <p className="admin-meta">{n.published ? 'Published' : 'Draft'}</p>
              </div>
              <div className="admin-list-actions">
                <button type="button" className="btn-icon" onClick={() => handleEdit(n)} aria-label="Edit"><IconEdit2 size={18} /></button>
                <button type="button" className="btn-icon danger" onClick={() => handleDelete(n.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNewsPage;
