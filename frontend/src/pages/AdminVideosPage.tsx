import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconPlus, IconEdit2, IconTrash2, IconVideo } from '../components/Icons';
import './AdminVideosPage.css';

type Video = {
  id: number;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  duration_sec?: number | null;
  difficulty: string;
  published: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

const AdminVideosPage: React.FC = () => {
  usePageTitle('Admin - Videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration_sec: '',
    difficulty: 'Beginner',
    published: true,
  });

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch(`${API_BASE_URL}/admin/videos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load videos');
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error(e);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const resetForm = () => {
    setForm({ title: '', description: '', video_url: '', thumbnail_url: '', duration_sec: '', difficulty: 'Beginner', published: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (v: Video) => {
    setEditing(v);
    setForm({
      title: v.title,
      description: v.description || '',
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url || '',
      duration_sec: v.duration_sec ? String(v.duration_sec) : '',
      difficulty: v.difficulty || 'Beginner',
      published: v.published,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const url = editing
      ? `${API_BASE_URL}/admin/videos/${editing.id}`
      : `${API_BASE_URL}/admin/videos`;
    const body = editing
      ? { title: form.title, description: form.description || null, video_url: form.video_url, thumbnail_url: form.thumbnail_url || null, duration_sec: form.duration_sec ? parseInt(form.duration_sec, 10) : null, difficulty: form.difficulty, published: form.published }
      : { title: form.title, description: form.description || null, video_url: form.video_url, thumbnail_url: form.thumbnail_url || null, duration_sec: form.duration_sec ? parseInt(form.duration_sec, 10) : null, difficulty: form.difficulty, published: form.published };
    try {
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchVideos();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this video?')) return;
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchVideos();
      if (editing?.id === id) resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDuration = (sec: number | null | undefined) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-videos-page app-page page-container">
      <div className="page-header admin-content-header">
        <div>
          <Link to="/admin" className="back-link">← Admin</Link>
          <h1><IconVideo size={24} /> Manage Videos</h1>
          <p>Add or edit video tutorials. They appear on /tutorials. Use YouTube, Vimeo, or self-hosted URLs.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <IconPlus size={18} /> Add Video
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2>{editing ? 'Edit Video' : 'New Video'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="video-title">Title</label>
              <input id="video-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="video-desc">Description</label>
              <textarea id="video-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="video-url">Video URL *</label>
              <input id="video-url" type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." required />
            </div>
            <div className="form-group">
              <label htmlFor="video-thumb">Thumbnail URL</label>
              <input id="video-thumb" type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="video-duration">Duration (seconds)</label>
                <input id="video-duration" type="number" min={0} value={form.duration_sec} onChange={(e) => setForm({ ...form, duration_sec: e.target.value })} placeholder="192" />
              </div>
              <div className="form-group">
                <label htmlFor="video-difficulty">Difficulty</label>
                <select id="video-difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
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

      {loading && <p className="admin-loading">Loading videos...</p>}
      {!loading && videos.length === 0 && (
        <div className="admin-empty">
          <p>No videos yet. Click &quot;Add Video&quot; to create one.</p>
        </div>
      )}
      {!loading && videos.length > 0 && (
        <div className="admin-list">
          {videos.map((v) => (
            <div key={v.id} className="admin-list-card">
              <div className="admin-list-body">
                <h3>{v.title}</h3>
                <p className="admin-meta">{formatDuration(v.duration_sec)} · {v.difficulty} · {v.published ? 'Published' : 'Draft'}</p>
              </div>
              <div className="admin-list-actions">
                <button type="button" className="btn-icon" onClick={() => handleEdit(v)} aria-label="Edit"><IconEdit2 size={18} /></button>
                <button type="button" className="btn-icon danger" onClick={() => handleDelete(v.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVideosPage;
