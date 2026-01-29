import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconStar } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonCardGrid } from '../components/Skeleton';
import { useShelf } from '../context/ShelfContext';
import './MyShelfPage.css';

interface DisplayProduct {
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
  usePageTitle('My Shelf');
  const navigate = useNavigate();
  const { 
    products: shelfProducts, 
    loading, 
    totalCount,
    usingCount,
    wishlistCount,
    discontinuedCount,
    removeFromShelf, 
    updateProductStatus 
  } = useShelf();
  
  const [filter, setFilter] = useState<'all' | 'using' | 'wishlist' | 'discontinued'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Transform shelf products to display format
  const products: DisplayProduct[] = useMemo(() => {
    return shelfProducts.map(p => ({
      id: p.id,
      name: p.product_name,
      brand: p.product_brand || 'Unknown',
      category: p.product_category || 'General',
      rating: p.rating || 0,
      status: p.status === 'active' ? 'using' as const : 
              p.status === 'wishlist' ? 'wishlist' as const : 'discontinued' as const,
      notes: p.notes || '',
      addedDate: p.created_at ? p.created_at.split('T')[0] : '',
      imageUrl: p.product_image,
    }));
  }, [shelfProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesFilter = filter === 'all' || product.status === filter;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleUpdateStatus = async (productId: string, newStatus: DisplayProduct['status']) => {
    const apiStatus = newStatus === 'using' ? 'active' : newStatus;
    await updateProductStatus(productId, apiStatus as 'active' | 'wishlist' | 'discontinued');
  };

  const handleRemoveProduct = (productId: string) => {
    setConfirmRemoveId(productId);
  };

  const doRemoveProduct = async () => {
    if (!confirmRemoveId) return;
    await removeFromShelf(confirmRemoveId);
    setConfirmRemoveId(null);
  };

  if (loading) {
    return (
      <div className="myshelf-page">
        <div className="myshelf-skeleton" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <div className="skeleton skeleton-heading" style={{ width: 220, height: 28, marginBottom: 24 }} />
          <SkeletonCardGrid count={6} hasImage={true} />
        </div>
      </div>
    );
  }

  const placeholderImage =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
        '<defs>' +
          '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#f0f4ff"/>' +
            '<stop offset="50%" stop-color="#e8f0fe"/>' +
            '<stop offset="100%" stop-color="#dbeafe"/>' +
          '</linearGradient>' +
          '<linearGradient id="icon" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#3b82f6"/>' +
            '<stop offset="100%" stop-color="#8b5cf6"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<rect width="100%" height="100%" fill="url(#bg)"/>' +
        '<g transform="translate(175, 115)">' +
          '<rect x="5" y="0" width="40" height="70" rx="6" fill="url(#icon)" opacity="0.9"/>' +
          '<rect x="10" y="5" width="30" height="12" rx="3" fill="white" opacity="0.3"/>' +
          '<circle cx="25" cy="45" r="10" fill="white" opacity="0.2"/>' +
        '</g>' +
        '<text x="50%" y="220" text-anchor="middle" fill="#94a3b8" font-size="13" font-family="system-ui, sans-serif" font-weight="500">' +
          'Product Image' +
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
            All ({totalCount})
          </button>
          <button 
            className={filter === 'using' ? 'active' : ''}
            onClick={() => setFilter('using')}
          >
            Using ({usingCount})
          </button>
          <button 
            className={filter === 'wishlist' ? 'active' : ''}
            onClick={() => setFilter('wishlist')}
          >
            Wishlist ({wishlistCount})
          </button>
          <button 
            className={filter === 'discontinued' ? 'active' : ''}
            onClick={() => setFilter('discontinued')}
          >
            Discontinued ({discontinuedCount})
          </button>
        </div>
        <button className="add-product-btn" onClick={() => navigate('/scan')}>
          Add Product
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No products on your shelf yet</h3>
          <p>Add products from recommendations or scan a product to build your collection.</p>
          <button className="btn-primary" onClick={() => navigate('/scan')}>
            Add Your First Product
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
                  loading="lazy"
                  width={120}
                  height={120}
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

      <ConfirmModal
        open={!!confirmRemoveId}
        title="Remove from shelf"
        message="Remove this product from your shelf? You can add it again later."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={doRemoveProduct}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
};

export default MyShelfPage;
