import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, getUploadFullUrl } from '../config';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  IconPlus,
  IconEdit2,
  IconTrash2,
  IconFileText,
  IconVideo,
  IconNewspaper,
  IconBarChart,
} from '../components/Icons';
import { AdminImageUpload } from '../components/AdminImageUpload';
import './AdminContentPage.css';

type TabId = 'overview' | 'blogs' | 'videos' | 'news';

type AdminSummary = {
  user_count: number;
  active_user_count: number;
  scan_count: number;
  product_count: number;
  routine_count: number;
  snapshot_count: number;
};

type Blog = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  read_time_min: number;
  published: boolean;
  sort_order: number;
};

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
};

type NewsItem = {
  id: number;
  title: string;
  body?: string | null;
  link_url?: string | null;
  is_featured: boolean;
  published: boolean;
  sort_order: number;
};

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <IconBarChart size={18} /> },
  { id: 'blogs', label: 'Blogs', icon: <IconFileText size={18} /> },
  { id: 'videos', label: 'Videos', icon: <IconVideo size={18} /> },
  { id: 'news', label: 'News', icon: <IconNewspaper size={18} /> },
];

const AdminContentPage: React.FC = () => {
  usePageTitle('Admin - Content');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<'blog' | 'video' | 'news' | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', cover_image_url: '', read_time_min: 5, published: true });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', duration_sec: '', difficulty: 'Beginner', published: true });
  const [newsForm, setNewsForm] = useState({ title: '', body: '', link_url: '', is_featured: false, published: true });

  const token = () => localStorage.getItem('auth_token');
  const headers = () => ({ ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/summary`, { headers: headers() });
      if (res.ok) setSummary(await res.json());
    } catch {
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headers() is stable per render
  }, []);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs`, { headers: headers() });
      setBlogs(res.ok ? await res.json() : []);
    } catch {
      setBlogs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headers() is stable per render
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, { headers: headers() });
      setVideos(res.ok ? await res.json() : []);
    } catch {
      setVideos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headers() is stable per render
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/news`, { headers: headers() });
      setNews(res.ok ? await res.json() : []);
    } catch {
      setNews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headers() is stable per render
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchBlogs(), fetchVideos(), fetchNews()]);
      setLoading(false);
    };
    load();
  }, [fetchSummary, fetchBlogs, fetchVideos, fetchNews]);

  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBlog ? `${API_BASE_URL}/admin/blogs/${editingBlog.id}` : `${API_BASE_URL}/admin/blogs`;
    const body = { ...blogForm, cover_image_url: blogForm.cover_image_url || null, excerpt: blogForm.excerpt || null, content: blogForm.content || null };
    const res = await fetch(url, { method: editingBlog ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) });
    if (res.ok) {
      await fetchBlogs();
      setShowForm(null);
      setEditingBlog(null);
      setBlogForm({ title: '', excerpt: '', content: '', cover_image_url: '', read_time_min: 5, published: true });
    }
  };

  const saveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingVideo ? `${API_BASE_URL}/admin/videos/${editingVideo.id}` : `${API_BASE_URL}/admin/videos`;
    const body = {
      ...videoForm,
      thumbnail_url: videoForm.thumbnail_url || null,
      description: videoForm.description || null,
      duration_sec: videoForm.duration_sec ? parseInt(videoForm.duration_sec, 10) : null,
    };
    const res = await fetch(url, { method: editingVideo ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) });
    if (res.ok) {
      await fetchVideos();
      setShowForm(null);
      setEditingVideo(null);
      setVideoForm({ title: '', description: '', video_url: '', thumbnail_url: '', duration_sec: '', difficulty: 'Beginner', published: true });
    }
  };

  const saveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingNews ? `${API_BASE_URL}/admin/news/${editingNews.id}` : `${API_BASE_URL}/admin/news`;
    const body = { ...newsForm, body: newsForm.body || null, link_url: newsForm.link_url || null };
    const res = await fetch(url, { method: editingNews ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) });
    if (res.ok) {
      await fetchNews();
      setShowForm(null);
      setEditingNews(null);
      setNewsForm({ title: '', body: '', link_url: '', is_featured: false, published: true });
    }
  };

  const deleteBlog = async (id: number) => {
    if (!confirm('Delete this blog?')) return;
    const res = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, { method: 'DELETE', headers: headers() });
    if (res.ok) await fetchBlogs();
  };

  const deleteVideo = async (id: number) => {
    if (!confirm('Delete this video?')) return;
    const res = await fetch(`${API_BASE_URL}/admin/videos/${id}`, { method: 'DELETE', headers: headers() });
    if (res.ok) await fetchVideos();
  };

  const deleteNews = async (id: number) => {
    if (!confirm('Delete this news item?')) return;
    const res = await fetch(`${API_BASE_URL}/admin/news/${id}`, { method: 'DELETE', headers: headers() });
    if (res.ok) await fetchNews();
  };

  const formatDuration = (sec: number | null | undefined) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-content-page app-page page-container">
      <div className="admin-content-header">
        <Link to="/admin" className="back-link">← Dashboard</Link>
        <h1>Content Management</h1>
        <p>Manage blogs, videos, and news from one place.</p>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading && <p className="admin-loading">Loading...</p>}

      {!loading && activeTab === 'overview' && (
        <div className="admin-overview">
          {summary && (
            <div className="admin-summary-grid">
              <div className="admin-card"><div className="admin-metric">{summary.user_count}</div><div className="admin-label">Users</div></div>
              <div className="admin-card"><div className="admin-metric">{summary.scan_count}</div><div className="admin-label">Scans</div></div>
              <div className="admin-card"><div className="admin-metric">{summary.product_count}</div><div className="admin-label">Products</div></div>
              <div className="admin-card"><div className="admin-metric">{blogs.length}</div><div className="admin-label">Blogs</div></div>
              <div className="admin-card"><div className="admin-metric">{videos.length}</div><div className="admin-label">Videos</div></div>
              <div className="admin-card"><div className="admin-metric">{news.length}</div><div className="admin-label">News</div></div>
            </div>
          )}
          <div className="admin-actions">
            <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
            <Link to="/admin/products" className="btn btn-secondary">Manage Products</Link>
            <Link to="/admin/catalog" className="btn btn-secondary">Catalog Admin</Link>
          </div>
        </div>
      )}

      {!loading && activeTab === 'blogs' && (
        <div className="admin-tab-content">
          <div className="admin-tab-header">
            <h2>Blogs</h2>
            <button type="button" className="btn btn-primary" onClick={() => { setShowForm('blog'); setEditingBlog(null); setBlogForm({ title: '', excerpt: '', content: '', cover_image_url: '', read_time_min: 5, published: true }); }}>
              <IconPlus size={18} /> Add Blog
            </button>
          </div>
          {showForm === 'blog' && (
            <div className="admin-form-card">
              <h3>{editingBlog ? 'Edit Blog' : 'New Blog'}</h3>
              <form onSubmit={saveBlog}>
                <div className="form-group"><label>Title</label><input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required /></div>
                <div className="form-group"><label>Excerpt</label><textarea rows={2} value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} /></div>
                <div className="form-group"><label>Content</label><textarea rows={6} value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} /></div>
                <AdminImageUpload
                  label="Cover Image"
                  recommendedSize="1200×630px recommended"
                  value={blogForm.cover_image_url}
                  onChange={(url) => setBlogForm({ ...blogForm, cover_image_url: url })}
                  id="blog-cover"
                />
                <div className="form-row">
                  <div className="form-group"><label>Read time (min)</label><input type="number" min={1} value={blogForm.read_time_min} onChange={(e) => setBlogForm({ ...blogForm, read_time_min: parseInt(e.target.value, 10) || 5 })} /></div>
                  <div className="form-group checkbox"><label><input type="checkbox" checked={blogForm.published} onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })} /> Published</label></div>
                </div>
                <div className="form-actions"><button type="submit" className="btn btn-primary">Save</button><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(null); setEditingBlog(null); }}>Cancel</button></div>
              </form>
            </div>
          )}
          <div className="admin-list">
            {blogs.map((b) => (
              <div key={b.id} className="admin-list-card">
                <div className="admin-list-body"><h4>{b.title}</h4><p className="admin-meta">{b.read_time_min} min · {b.published ? 'Published' : 'Draft'}</p></div>
                <div className="admin-list-actions">
                  <button type="button" className="btn-icon" onClick={() => { setEditingBlog(b); setBlogForm({
              title: b.title,
              excerpt: b.excerpt || '',
              content: b.content || '',
              cover_image_url: b.cover_image_url?.startsWith('http') ? b.cover_image_url : (b.cover_image_url ? getUploadFullUrl(b.cover_image_url) : ''),
              read_time_min: b.read_time_min,
              published: b.published,
            }); setShowForm('blog'); }} aria-label="Edit"><IconEdit2 size={18} /></button>
                  <button type="button" className="btn-icon danger" onClick={() => deleteBlog(b.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          {blogs.length === 0 && !showForm && <p className="admin-empty">No blogs yet. Click Add Blog to create one.</p>}
        </div>
      )}

      {!loading && activeTab === 'videos' && (
        <div className="admin-tab-content">
          <div className="admin-tab-header">
            <h2>Videos</h2>
            <button type="button" className="btn btn-primary" onClick={() => { setShowForm('video'); setEditingVideo(null); setVideoForm({ title: '', description: '', video_url: '', thumbnail_url: '', duration_sec: '', difficulty: 'Beginner', published: true }); }}>
              <IconPlus size={18} /> Add Video
            </button>
          </div>
          {showForm === 'video' && (
            <div className="admin-form-card">
              <h3>{editingVideo ? 'Edit Video' : 'New Video'}</h3>
              <form onSubmit={saveVideo}>
                <div className="form-group"><label>Title</label><input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required /></div>
                <div className="form-group"><label>Description</label><textarea rows={2} value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} /></div>
                <div className="form-group"><label>Video URL (YouTube, Vimeo, etc.)</label><input type="url" value={videoForm.video_url} onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." required /></div>
                <AdminImageUpload
                  label="Thumbnail Image"
                  recommendedSize="1280×720px recommended"
                  value={videoForm.thumbnail_url}
                  onChange={(url) => setVideoForm({ ...videoForm, thumbnail_url: url })}
                  id="video-thumb"
                />
                <div className="form-row">
                  <div className="form-group"><label>Duration (sec)</label><input type="number" min={0} value={videoForm.duration_sec} onChange={(e) => setVideoForm({ ...videoForm, duration_sec: e.target.value })} placeholder="192" /></div>
                  <div className="form-group"><label>Difficulty</label><select value={videoForm.difficulty} onChange={(e) => setVideoForm({ ...videoForm, difficulty: e.target.value })}><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
                  <div className="form-group checkbox"><label><input type="checkbox" checked={videoForm.published} onChange={(e) => setVideoForm({ ...videoForm, published: e.target.checked })} /> Published</label></div>
                </div>
                <div className="form-actions"><button type="submit" className="btn btn-primary">Save</button><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(null); setEditingVideo(null); }}>Cancel</button></div>
              </form>
            </div>
          )}
          <div className="admin-list">
            {videos.map((v) => (
              <div key={v.id} className="admin-list-card">
                <div className="admin-list-body"><h4>{v.title}</h4><p className="admin-meta">{formatDuration(v.duration_sec)} · {v.difficulty} · {v.published ? 'Published' : 'Draft'}</p></div>
                <div className="admin-list-actions">
                  <button type="button" className="btn-icon" onClick={() => { setEditingVideo(v); setVideoForm({
              title: v.title,
              description: v.description || '',
              video_url: v.video_url,
              thumbnail_url: v.thumbnail_url?.startsWith('http') ? v.thumbnail_url : (v.thumbnail_url ? getUploadFullUrl(v.thumbnail_url) : ''),
              duration_sec: v.duration_sec ? String(v.duration_sec) : '',
              difficulty: v.difficulty,
              published: v.published,
            }); setShowForm('video'); }} aria-label="Edit"><IconEdit2 size={18} /></button>
                  <button type="button" className="btn-icon danger" onClick={() => deleteVideo(v.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          {videos.length === 0 && !showForm && <p className="admin-empty">No videos yet. Click Add Video to create one.</p>}
        </div>
      )}

      {!loading && activeTab === 'news' && (
        <div className="admin-tab-content">
          <div className="admin-tab-header">
            <h2>News</h2>
            <button type="button" className="btn btn-primary" onClick={() => { setShowForm('news'); setEditingNews(null); setNewsForm({ title: '', body: '', link_url: '', is_featured: false, published: true }); }}>
              <IconPlus size={18} /> Add News
            </button>
          </div>
          {showForm === 'news' && (
            <div className="admin-form-card">
              <h3>{editingNews ? 'Edit News' : 'New News'}</h3>
              <form onSubmit={saveNews}>
                <div className="form-group"><label>Title</label><input value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} required /></div>
                <div className="form-group"><label>Body</label><textarea rows={4} value={newsForm.body} onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })} /></div>
                <div className="form-group"><label>Link URL</label><input type="url" value={newsForm.link_url} onChange={(e) => setNewsForm({ ...newsForm, link_url: e.target.value })} placeholder="https://..." /></div>
                <div className="form-group checkbox-row"><label><input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm({ ...newsForm, is_featured: e.target.checked })} /> Featured</label><label><input type="checkbox" checked={newsForm.published} onChange={(e) => setNewsForm({ ...newsForm, published: e.target.checked })} /> Published</label></div>
                <div className="form-actions"><button type="submit" className="btn btn-primary">Save</button><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(null); setEditingNews(null); }}>Cancel</button></div>
              </form>
            </div>
          )}
          <div className="admin-list">
            {news.map((n) => (
              <div key={n.id} className="admin-list-card">
                <div className="admin-list-body"><h4>{n.title} {n.is_featured && <span className="badge">Featured</span>}</h4><p className="admin-meta">{n.published ? 'Published' : 'Draft'}</p></div>
                <div className="admin-list-actions">
                  <button type="button" className="btn-icon" onClick={() => { setEditingNews(n); setNewsForm({ title: n.title, body: n.body || '', link_url: n.link_url || '', is_featured: n.is_featured, published: n.published }); setShowForm('news'); }} aria-label="Edit"><IconEdit2 size={18} /></button>
                  <button type="button" className="btn-icon danger" onClick={() => deleteNews(n.id)} aria-label="Delete"><IconTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          {news.length === 0 && !showForm && <p className="admin-empty">No news yet. Click Add News to create one.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminContentPage;
