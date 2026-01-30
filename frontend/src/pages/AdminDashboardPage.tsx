import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboardPage.css';

type AdminSummary = {
  user_count: number;
  active_user_count: number;
  scan_count: number;
  product_count: number;
  routine_count: number;
  snapshot_count: number;
};

const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/admin/summary`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load admin summary');
        }
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error('Admin summary error:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="admin-dashboard-page page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Operational overview and management tools.</p>
      </div>

      {isLoading && <div className="admin-card">Loading admin summary...</div>}
      {hasError && <div className="admin-card">Unable to load admin data.</div>}

      {summary && (
        <div className="admin-summary-grid">
          <div className="admin-card">
            <div className="admin-metric">{summary.user_count}</div>
            <div className="admin-label">Total Users</div>
          </div>
          <div className="admin-card">
            <div className="admin-metric">{summary.active_user_count}</div>
            <div className="admin-label">Active Users</div>
          </div>
          <div className="admin-card">
            <div className="admin-metric">{summary.scan_count}</div>
            <div className="admin-label">Total Scans</div>
          </div>
          <div className="admin-card">
            <div className="admin-metric">{summary.product_count}</div>
            <div className="admin-label">Products</div>
          </div>
          <div className="admin-card">
            <div className="admin-metric">{summary.routine_count}</div>
            <div className="admin-label">Saved Routines</div>
          </div>
          <div className="admin-card">
            <div className="admin-metric">{summary.snapshot_count}</div>
            <div className="admin-label">Twin Snapshots</div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
        <Link to="/admin/products" className="btn btn-secondary">Manage Products</Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
