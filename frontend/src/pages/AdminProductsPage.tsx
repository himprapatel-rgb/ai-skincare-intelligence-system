import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const fetchProducts = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_BASE}/admin/products?${params.toString()}`, {
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
      console.error('Admin products error:', error);
      setProducts([]);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const submitProduct = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const payload = {
        brand: form.brand,
        name: form.name,
        category: form.category,
        upc: form.upc || null,
        price_usd: form.price_usd ? Number(form.price_usd) : null,
        product_image_url: form.product_image_url || null,
      };
      const response = await fetch(`${API_BASE}/admin/products${editingId ? `/${editingId}` : ''}`, {
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
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
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
    <div className="admin-products-page page-container">
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
        <button className="btn btn-secondary" onClick={fetchProducts}>Search</button>
        <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
      </div>

      <div className="admin-product-form">
        <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
        <div className="admin-product-grid">
          <input placeholder="Brand" value={form.brand} onChange={handleChange('brand')} />
          <input placeholder="Name" value={form.name} onChange={handleChange('name')} />
          <input placeholder="Category" value={form.category} onChange={handleChange('category')} />
          <input placeholder="UPC" value={form.upc} onChange={handleChange('upc')} />
          <input placeholder="Price USD" value={form.price_usd} onChange={handleChange('price_usd')} />
          <input placeholder="Image URL" value={form.product_image_url} onChange={handleChange('product_image_url')} />
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

      <div className="admin-product-list">
        {products.map((product) => (
          <div key={product.id} className="admin-product-row">
            <div>
              <div className="admin-product-title">{product.name}</div>
              <div className="admin-product-subtitle">{product.brand} · {product.category}</div>
            </div>
            <div className="admin-product-meta">
              <span>{product.price_usd ? `$${product.price_usd}` : '—'}</span>
              <span>{product.upc || 'No UPC'}</span>
            </div>
            <div className="admin-product-actions">
              <button className="btn btn-secondary" onClick={() => startEdit(product)}>Edit</button>
              <button className="btn btn-secondary" onClick={() => deleteProduct(product.id)}>Delete</button>
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="admin-card">No products found.</div>}
      </div>
    </div>
  );
};

export default AdminProductsPage;
