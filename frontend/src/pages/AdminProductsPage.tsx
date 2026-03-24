import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import './AdminProductsPage.css';

type AdminProduct = {
  id: string;
  brand: string;
  name: string;
  category: string;
  upc?: string | null;
  price_usd?: number | null;
  product_image_url?: string | null;
};

type SortKey = 'brand' | 'name' | 'category';
type SortDir = 'asc' | 'desc';

const emptyForm = {
  brand: '',
  name: '',
  category: '',
  upc: '',
  price_usd: '',
  product_image_url: '',
};

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_BASE_URL}/admin/products?${params.toString()}`, {
        signal,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Admin products error:', error);
      setProducts([]);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const handleSort = useCallback((key: SortKey) => {
    setSortBy(key);
    setSortDir((d) => (sortBy === key && d === 'asc' ? 'desc' : 'asc'));
  }, [sortBy]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      const aVal = String(a[sortBy] ?? '');
      const bVal = String(b[sortBy] ?? '');
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, sortBy, sortDir]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const bulkDelete = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const ids = Array.from(selectedIds);
    const deleted = new Set<string>();
    for (const id of ids) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
          method: 'DELETE',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (response.ok) deleted.add(id);
      } catch (err) {
        console.error('Delete product failed:', id, err);
      }
    }
    setProducts((prev) => prev.filter((item) => !deleted.has(item.id)));
    setSelectedIds(new Set());
  };

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const submitProduct = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const payload = {
        brand: form.brand,
        name: form.name,
        category: form.category,
        upc: form.upc || null,
        price_usd: form.price_usd ? Number(form.price_usd) : null,
        product_image_url: form.product_image_url || null,
      };
      const response = await fetch(`${API_BASE_URL}/admin/products${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      const saved = await response.json();
      setProducts((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? saved : item));
        }
        return [saved, ...prev];
      });
      resetForm();
    } catch (error) {
      console.error('Product save failed:', error);
    }
  };

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      brand: product.brand,
      name: product.name,
      category: product.category,
      upc: product.upc || '',
      price_usd: product.price_usd?.toString() || '',
      product_image_url: product.product_image_url || '',
    });
  };

  const deleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      setProducts((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      console.error('Delete product failed:', error);
    }
  };

  return (
    <div className="admin-products-page app-page page-container">
      <div className="page-header">
        <h1>Admin Products</h1>
        <p>Manage catalog products and metadata.</p>
      </div>

      <div className="admin-products-toolbar">
        <input
          type="text"
          placeholder="Search by brand or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-secondary" onClick={() => fetchProducts()}>Search</button>
        <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
        {selectedIds.size > 0 && (
          <button type="button" className="btn btn-primary admin-bulk-delete" onClick={bulkDelete}>
            Delete selected ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="admin-product-form">
        <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
        <div className="admin-product-grid">
          <input placeholder="Brand" aria-label="Brand" value={form.brand} onChange={handleChange('brand')} />
          <input placeholder="Name" aria-label="Product name" value={form.name} onChange={handleChange('name')} />
          <input placeholder="Category" aria-label="Category" value={form.category} onChange={handleChange('category')} />
          <input placeholder="UPC" aria-label="UPC barcode" value={form.upc} onChange={handleChange('upc')} />
          <input placeholder="Price USD" aria-label="Price in USD" value={form.price_usd} onChange={handleChange('price_usd')} />
          <input placeholder="Image URL" aria-label="Image URL" value={form.product_image_url} onChange={handleChange('product_image_url')} />
        </div>
        <div className="admin-product-actions">
          <button className="btn btn-primary" onClick={submitProduct}>
            {editingId ? 'Update Product' : 'Create Product'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </div>

      <div className="admin-products-table-wrapper">
        <table className="admin-products-table" role="grid">
          <thead>
            <tr className="admin-products-header">
              <th scope="col">
                <label className="admin-select-all">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={selectAll}
                    aria-label="Select all products"
                  />
                </label>
              </th>
              <th scope="col">
                <button type="button" className="admin-sort-btn" onClick={() => handleSort('brand')} aria-sort={sortBy === 'brand' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  Brand {sortBy === 'brand' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th scope="col">
                <button type="button" className="admin-sort-btn" onClick={() => handleSort('name')} aria-sort={sortBy === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th scope="col">
                <button type="button" className="admin-sort-btn" onClick={() => handleSort('category')} aria-sort={sortBy === 'category' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th scope="col">Price</th>
              <th scope="col">UPC</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <tr key={product.id} className="admin-product-row">
                <td>
                  <label className="admin-row-select">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </label>
                </td>
                <td>{product.brand}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.price_usd != null ? `$${product.price_usd}` : '—'}</td>
                <td>{product.upc || '—'}</td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => startEdit(product)}>Edit</button>
                  <button type="button" className="btn btn-secondary" onClick={() => deleteProduct(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {products.length === 0 && (
        <div className="admin-card admin-empty-state" role="status">
          <p className="admin-empty-title">No products in catalog</p>
          <p className="admin-empty-text">Add a product using the form above, or run a search to load from the API.</p>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
