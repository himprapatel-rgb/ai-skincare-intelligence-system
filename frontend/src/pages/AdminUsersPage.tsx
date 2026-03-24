import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
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

type SortKey = 'email' | 'full_name' | 'created_at';
type SortDir = 'asc' | 'desc';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('email');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        signal,
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
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Admin users error:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleSort = useCallback((key: SortKey) => {
    setSortBy(key);
    setSortDir((d) => (sortBy === key && d === 'asc' ? 'desc' : 'asc'));
  }, [sortBy]);

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      const aVal = (a[sortBy] ?? '') as string;
      const bVal = (b[sortBy] ?? '') as string;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, sortBy, sortDir]);

  const updateUser = async (userId: number, updates: Partial<AdminUser>) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
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
    <div className="admin-users-page app-page page-container">
      <div className="page-header">
        <h1>Admin Users</h1>
        <p>Manage access and account status.</p>
      </div>

      <div className="admin-users-toolbar">
        <input
          type="search"
          placeholder="Search by email or name"
          aria-label="Search users by email or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-secondary" onClick={() => fetchUsers()}>Search</button>
        <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
      </div>

      {isLoading ? (
        <div className="admin-card">Loading users...</div>
      ) : (
        <>
        <div className="admin-users-table-wrapper">
        <table className="admin-users-table" role="grid">
          <thead>
            <tr className="admin-users-row admin-users-header">
              <th scope="col"><button type="button" className="admin-sort-btn" onClick={() => handleSort('email')} aria-sort={sortBy === 'email' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>Email {sortBy === 'email' && (sortDir === 'asc' ? '↑' : '↓')}</button></th>
              <th scope="col"><button type="button" className="admin-sort-btn" onClick={() => handleSort('full_name')} aria-sort={sortBy === 'full_name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>Name {sortBy === 'full_name' && (sortDir === 'asc' ? '↑' : '↓')}</button></th>
              <th scope="col">Active</th>
              <th scope="col">Verified</th>
              <th scope="col">Admin</th>
            </tr>
          </thead>
          <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id} className="admin-users-row">
              <td>{user.email}</td>
              <td>{user.full_name || '—'}</td>
              <td><label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_active}
                  onChange={(event) => updateUser(user.id, { is_active: event.target.checked })}
                />
                <span />
              </label></td>
              <td><label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_verified}
                  onChange={(event) => updateUser(user.id, { is_verified: event.target.checked })}
                />
                <span />
              </label></td>
              <td><label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={user.is_admin}
                  onChange={(event) => updateUser(user.id, { is_admin: event.target.checked })}
                />
                <span />
              </label></td>
            </tr>
          ))}
          </tbody>
        </table>
        </div>

        <div className="admin-users-cards" role="region" aria-label="Users list">
          {sortedUsers.map((user) => (
            <div key={user.id} className="admin-user-card">
              <div className="admin-user-card-header">
                <strong>{user.email}</strong>
                <span className="admin-user-card-name">{user.full_name || '—'}</span>
              </div>
              <div className="admin-user-card-toggles">
                <label className="admin-user-card-toggle">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={user.is_active}
                    onChange={(e) => updateUser(user.id, { is_active: e.target.checked })}
                  />
                </label>
                <label className="admin-user-card-toggle">
                  <span>Verified</span>
                  <input
                    type="checkbox"
                    checked={user.is_verified}
                    onChange={(e) => updateUser(user.id, { is_verified: e.target.checked })}
                  />
                </label>
                <label className="admin-user-card-toggle">
                  <span>Admin</span>
                  <input
                    type="checkbox"
                    checked={user.is_admin}
                    onChange={(e) => updateUser(user.id, { is_admin: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
          {users.length === 0 && (
            <div className="admin-card admin-empty-state" role="status">
              <p className="admin-empty-title">No users yet</p>
              <p className="admin-empty-text">Users will appear here once they register. Use search to filter by email or name.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
