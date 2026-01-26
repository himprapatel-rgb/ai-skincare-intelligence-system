import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminUsersPage.css';

type AdminUser = {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at?: string | null;
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Admin users error:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (userId: number, updates: Partial<AdminUser>) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      const updated = await response.json();
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
    } catch (error) {
      console.error('Update user failed:', error);
    }
  };

  return (
    <div className="admin-users-page page-container">
      <div className="page-header">
        <h1>Admin Users</h1>
        <p>Manage access and account status.</p>
      </div>

      <div className="admin-users-toolbar">
        <input
          type="text"
          placeholder="Search by email or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-secondary" onClick={fetchUsers}>Search</button>
        <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
      </div>

      {isLoading ? (
        <div className="admin-card">Loading users...</div>
      ) : (
        <div className="admin-users-table">
          <div className="admin-users-row admin-users-header">
            <span>Email</span>
            <span>Name</span>
            <span>Active</span>
            <span>Verified</span>
            <span>Admin</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="admin-users-row">
              <span>{user.email}</span>
              <span>{user.full_name || '—'}</span>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_active}
                  onChange={(event) => updateUser(user.id, { is_active: event.target.checked })}
                />
                <span />
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_verified}
                  onChange={(event) => updateUser(user.id, { is_verified: event.target.checked })}
                />
                <span />
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_admin}
                  onChange={(event) => updateUser(user.id, { is_admin: event.target.checked })}
                />
                <span />
              </label>
            </div>
          ))}
          {users.length === 0 && <div className="admin-card">No users found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
