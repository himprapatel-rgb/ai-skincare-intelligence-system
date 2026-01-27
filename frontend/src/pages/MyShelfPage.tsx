import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconStar } from '../components/Icons';
import { mockProducts } from '../data/mockProducts';
import './MyShelfPage.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  status: 'using' | 'wishlist' | 'discontinued';
  notes: string;
  addedDate: string;
  imageUrl?: string;
}

const MyShelfPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'using' | 'wishlist' | 'discontinued'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setProducts(mockProducts);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/v1/shelf', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products.map((p: any) => ({
            id: p.id.toString(),
            name: p.product_name,
            brand: p.product_brand || 'Unknown',
            category: p.product_category || 'General',
            rating: p.rating || 0,
            status: p.status === 'active' ? 'using' : p.status === 'wishlist' ? 'wishlist' : 'discontinued',
            notes: p.notes || '',
            addedDate: p.created_at?.split('T')[0] || '',
            imageUrl: p.product_image,
          })));
        } else {
          setProducts(mockProducts);
        }
      } else {
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || product.status === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleUpdateStatus = async (productId: string, newStatus: Product['status']) => {
    try {
      const token = localStorage.getItem('token');
      const apiStatus = newStatus === 'using' ? 'active' : newStatus;
      
      await fetch(`/api/v1/shelf/${productId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: apiStatus })
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      // Still update UI
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Remove this product from your shelf?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/shelf/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove product:', error);
      // Still remove from UI
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  if (loading) {
    return (
      <div className="myshelf-page">
        <div className="loading-spinner">Loading your products...</div>
      </div>
    );
  }

  const placeholderImage =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#f8fafc"/>' +
        '</linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#g)"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="20" font-family="Arial, sans-serif">' +
        'No Image' +
        '</text>' +
      '</svg>'
    );

  return (
    <div className="myshelf-page">
      <div className="myshelf-header">
        <h1>My Shelf</h1>
        <p className="subtitle">Manage your skincare collection</p>
      </div>

      <div className="myshelf-onboarding">
        <h2>Build Your Shelf in Minutes</h2>
        <div className="myshelf-onboarding-grid">
          <div>
            <h3>Add Products Fast</h3>
            <p>Scan a barcode or pick from recommendations to populate your shelf.</p>
          </div>
          <div>
            <h3>Track What Works</h3>
            <p>Log what you are using to connect routine changes with progress.</p>
          </div>
          <div>
            <h3>Expiry Reminders</h3>
            <p>We help you keep track of open dates so you can replace products on time.</p>
          </div>
        </div>
      </div>

      <div className="myshelf-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({products.length})
          </button>
          <button 
            className={filter === 'using' ? 'active' : ''}
            onClick={() => setFilter('using')}
          >
            Using ({products.filter(p => p.status === 'using').length})
          </button>
          <button 
            className={filter === 'wishlist' ? 'active' : ''}
            onClick={() => setFilter('wishlist')}
          >
            Wishlist ({products.filter(p => p.status === 'wishlist').length})
          </button>
          <button 
            className={filter === 'discontinued' ? 'active' : ''}
            onClick={() => setFilter('discontinued')}
          >
            Discontinued ({products.filter(p => p.status === 'discontinued').length})
          </button>
        </div>
        <button className="add-product-btn" onClick={() => navigate('/scan')}>
          Add Product
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Start building your collection by scanning products or adding them manually.</p>
          <button className="btn-primary" onClick={() => navigate('/scan')}>
            Scan a Product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <button
                type="button"
                className="product-image-button"
                onClick={() => handleProductClick(product.id)}
                aria-label={`Open ${product.name}`}
              >
                <img
                  src={product.imageUrl || placeholderImage}
                  alt={product.name}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.src !== placeholderImage) {
                      target.src = placeholderImage;
                    }
                  }}
                />
              </button>
              
              <div className="product-info">
                <button
                  type="button"
                  className="product-title-button"
                  onClick={() => handleProductClick(product.id)}
                >
                  {product.name}
                </button>
                <p className="brand">{product.brand}</p>
                <p className="category">{product.category}</p>
                
                <div className="rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <IconStar
                      key={index}
                      size={14}
                      strokeWidth={2}
                      fill={index < Math.floor(product.rating) ? 'currentColor' : 'none'}
                      style={{ marginRight: '4px' }}
                    />
                  ))}
                  <span>{product.rating}</span>
                </div>
                
                {product.notes && (
                  <p className="notes">{product.notes}</p>
                )}
                
                <div className="product-actions">
                  <select 
                    value={product.status}
                    onChange={(e) => handleUpdateStatus(product.id, e.target.value as Product['status'])}
                    className="status-select"
                  >
                    <option value="using">Using</option>
                    <option value="wishlist">Wishlist</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                  
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveProduct(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyShelfPage;
