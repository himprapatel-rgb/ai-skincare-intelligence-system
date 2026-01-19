import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconStar } from '../components/Icons';
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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/products/shelf', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      
      // Mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Hydrating Serum',
          brand: 'CeraVe',
          category: 'Serum',
          rating: 4.5,
          status: 'using',
          notes: 'Great for morning routine',
          addedDate: '2025-01-01',
          imageUrl: '/placeholder.jpg'
        },
        {
          id: '2',
          name: 'Retinol Cream',
          brand: 'The Ordinary',
          category: 'Treatment',
          rating: 4.8,
          status: 'using',
          notes: 'Use only at night',
          addedDate: '2025-01-05'
        },
        {
          id: '3',
          name: 'Vitamin C Serum',
          brand: 'Skinceuticals',
          category: 'Serum',
          rating: 4.9,
          status: 'wishlist',
          notes: 'Want to try',
          addedDate: '2025-01-10'
        }
      ];
      
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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
      // TODO: API call to update status
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Remove this product from your shelf?')) return;
    
    try {
      // TODO: API call to remove product
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove product:', error);
    }
  };

  if (loading) {
    return (
      <div className="myshelf-page">
        <div className="loading-spinner">Loading your products...</div>
      </div>
    );
  }

  return (
    <div className="myshelf-page">
      <div className="myshelf-header">
        <h1>My Shelf</h1>
        <p className="subtitle">Manage your skincare collection</p>
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
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="placeholder-image">No Image</div>
                )}
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

      <button className="fab" onClick={() => navigate('/scan')} title="Scan new product">
        +
      </button>
    </div>
  );
};

export default MyShelfPage;
