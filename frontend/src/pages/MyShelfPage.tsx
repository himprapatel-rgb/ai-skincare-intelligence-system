import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconStar, IconPackage, IconMoreVertical, IconChevronDown, IconTrash2, IconSearch, IconX, IconPlus, IconRefresh } from '../components/Icons';
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
  expiryDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  wouldRepurchase?: boolean;
  /** Match % from scan (suitability_score in ingredients_json) */
  matchPct?: number | null;
}

const MyShelfPage: React.FC = () => {
  usePageTitle('My Shelf');
  const navigate = useNavigate();
  const { 
    products: shelfProducts, 
    loading, 
    totalCount,
    refreshShelf,
    removeFromShelf, 
    updateProductStatus,
    updateProduct
  } = useShelf();
  
  const [filter, setFilter] = useState<'all' | 'using' | 'wishlist' | 'discontinued'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [onboardingExpanded, setOnboardingExpanded] = useState(false);
  const [productMenuId, setProductMenuId] = useState<string | null>(null);
  const productMenuRef = useRef<HTMLDivElement>(null);

  // Task 276: Sorting options
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'brand' | 'rating'>('recent');
  // Task 278: Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productMenuRef.current && !productMenuRef.current.contains(e.target as Node)) {
        setProductMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      expiryDate: p.expiry_date,
      purchaseDate: p.purchase_date,
      purchasePrice: p.purchase_price,
      wouldRepurchase: p.would_repurchase,
      matchPct: (p as { ingredients_json?: { suitability_score?: number } }).ingredients_json?.suitability_score != null
        ? Math.round(Number((p as { ingredients_json?: { suitability_score?: number } }).ingredients_json?.suitability_score))
        : undefined,
    }));
  }, [shelfProducts]);

  // Task 278: Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesFilter = filter === 'all' || product.status === filter;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesFilter && matchesSearch && matchesCategory;
    });
    
    // Task 276: Apply sorting
    switch (sortBy) {
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'brand':
        result = result.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
      case 'rating':
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
      default:
        result = result.sort((a, b) => 
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
    }
    
    return result;
  }, [products, filter, searchTerm, categoryFilter, sortBy]);

  const expiringSoonProducts = useMemo(() => {
    return products
      .filter((p) => p.expiryDate && (isExpiryApproaching(p.expiryDate) || isExpired(p.expiryDate)))
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [products]);

  const handleProductClick = (productId: string) => {
    const shelfProduct = shelfProducts.find(p => p.id === productId);
    navigate(`/product/${productId}`, {
      state: shelfProduct ? { shelfProduct } : undefined,
    });
  };

  const handleUpdateStatus = async (productId: string, newStatus: DisplayProduct['status']) => {
    const apiStatus = newStatus === 'using' ? 'active' : newStatus;
    await updateProductStatus(productId, apiStatus as 'active' | 'wishlist' | 'discontinued');
  };

  const handleRemoveProduct = (productId: string) => {
    setConfirmRemoveId(productId);
  };

  const handleRatingChange = async (productId: string, newRating: number) => {
    await updateProduct(productId, { rating: newRating });
  };

  const handleWouldRepurchaseToggle = async (productId: string, current: boolean | undefined) => {
    await updateProduct(productId, { would_repurchase: !current });
  };

  // Helper to check if expiry is approaching (within 30 days)
  const isExpiryApproaching = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < thirtyDays && expiry.getTime() > now.getTime();
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
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
          'No image' +
        '</text>' +
      '</svg>'
    );

  return (
    <div className="myshelf-page app-page">
      <header className="myshelf-hero">
        <div className="myshelf-hero-inner">
          <div className="myshelf-hero-icon" aria-hidden>
            <IconPackage size={28} strokeWidth={2} />
          </div>
          <div className="myshelf-hero-text">
            <h1>My Shelf</h1>
            <p className="myshelf-hero-subtitle">
              {totalCount > 0 ? (
                <span className="myshelf-hero-count">{totalCount} product{totalCount !== 1 ? 's' : ''}</span>
              ) : (
                'Your skincare collection'
              )}
            </p>
          </div>
          <button
            type="button"
            className="myshelf-refresh-btn"
            onClick={() => refreshShelf()}
            disabled={loading}
            aria-label="Refresh shelf"
            title="Refresh"
          >
            <IconRefresh size={20} strokeWidth={2} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      <div className="app-page-content myshelf-content">
      {expiringSoonProducts.length > 0 && (
        <section className="myshelf-expiring-soon" aria-label="Expiring soon">
          <h2 className="myshelf-expiring-heading">
            <span className="myshelf-expiring-icon" aria-hidden>⏱</span>
            Expiring soon ({expiringSoonProducts.length})
          </h2>
          <div className="myshelf-expiring-scroll">
            {expiringSoonProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="myshelf-expiring-card"
                onClick={() => handleProductClick(product.id)}
              >
                <img
                  src={product.imageUrl || placeholderImage}
                  alt=""
                  className="myshelf-expiring-thumb"
                  onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
                />
                <span className="myshelf-expiring-name">{product.name}</span>
                <span className={`myshelf-expiring-badge ${isExpired(product.expiryDate) ? 'expired' : 'warning'}`}>
                  {product.expiryDate
                    ? (isExpired(product.expiryDate)
                        ? 'Expired'
                        : `Expires ${new Date(product.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`)
                    : ''}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="myshelf-onboarding" aria-label="Tips">
        <button
          type="button"
          className="myshelf-onboarding-toggle"
          onClick={() => setOnboardingExpanded(!onboardingExpanded)}
          aria-expanded={onboardingExpanded}
        >
          <span className="myshelf-onboarding-headline">Scan or add from recommendations · Track what you use · Get expiry reminders</span>
          <IconChevronDown size={20} strokeWidth={2} className={`myshelf-onboarding-chevron${onboardingExpanded ? ' open' : ''}`} aria-hidden />
        </button>
        {onboardingExpanded && (
          <div className="myshelf-onboarding-grid">
            <div className="myshelf-tip"><strong>Add</strong> — Scan a barcode or pick from recommendations.</div>
            <div className="myshelf-tip"><strong>Track</strong> — Log what you use and see it in your progress.</div>
            <div className="myshelf-tip"><strong>Remind</strong> — We’ll help you replace products before they expire.</div>
          </div>
        )}
      </section>

      <div className="myshelf-toolbar">
        <div className="myshelf-search-wrap">
          <IconSearch size={20} strokeWidth={2} className="myshelf-search-icon" aria-hidden />
          <input
            type="search"
            className="myshelf-search-input"
            placeholder="Search shelf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search shelf"
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              className="myshelf-search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <IconX size={18} strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="myshelf-pills-wrap">
          <div className="myshelf-pills" role="tablist" aria-label="Shelf filter">
            <button type="button" role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            <button type="button" role="tab" aria-selected={filter === 'using'} className={filter === 'using' ? 'active' : ''} onClick={() => setFilter('using')}>Using</button>
            <button type="button" role="tab" aria-selected={filter === 'wishlist'} className={filter === 'wishlist' ? 'active' : ''} onClick={() => setFilter('wishlist')}>Wishlist</button>
            <button type="button" role="tab" aria-selected={filter === 'discontinued'} className={filter === 'discontinued' ? 'active' : ''} onClick={() => setFilter('discontinued')}>Done</button>
          </div>
          <button type="button" className="myshelf-add-btn myshelf-add-btn-inline" onClick={() => navigate('/scanner')}>
            <IconPlus size={20} strokeWidth={2.5} />
            <span>Add product</span>
          </button>
        </div>
      </div>

      <div className="myshelf-sort-row">
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'brand' | 'rating')}
          className="myshelf-sort-select"
          aria-label="Sort by"
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="brand">Brand</option>
          <option value="rating">Rating</option>
        </select>
        <select
          id="category-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="myshelf-sort-select"
          aria-label="Category"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : cat}</option>
          ))}
        </select>
        <span className="myshelf-results">{filteredProducts.length} shown</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="myshelf-empty">
          <div className="myshelf-empty-icon" aria-hidden><IconPackage size={40} strokeWidth={1.5} /></div>
          <h2 className="myshelf-empty-title">Your shelf is empty</h2>
          <p className="myshelf-empty-desc">Add products from recommendations or scan a barcode to start your collection.</p>
          <button type="button" className="myshelf-add-btn myshelf-empty-cta" onClick={() => navigate('/scanner')}>
            <IconPlus size={20} strokeWidth={2.5} />
            Add your first product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrapper">
                <button
                  type="button"
                  className="product-image-button"
                  onClick={() => handleProductClick(product.id)}
                  aria-label={`Open ${product.name}`}
                >
                  <img
                    src={product.imageUrl || placeholderImage}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      const target = event.currentTarget;
                      if (target.src !== placeholderImage) target.src = placeholderImage;
                    }}
                  />
                </button>
              </div>
              <div className="product-info">
                <button type="button" className="product-title-button" onClick={() => handleProductClick(product.id)}>
                  {product.name}
                </button>
                <p className="brand">{product.brand}</p>
                <div className="product-card-meta-row">
                  <span className="product-status-pill" data-status={product.status}>{product.status === 'using' ? 'Using' : product.status === 'wishlist' ? 'Wishlist' : 'Done'}</span>
                  {product.matchPct != null && (
                    <span className="product-card-match" title="Match for your skin">🎯 {product.matchPct}% Match</span>
                  )}
                </div>
                <p className="category product-card-category">{product.category}</p>
                <div className="rating interactive-rating product-card-rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className="star-button"
                      onClick={(e) => { e.stopPropagation(); handleRatingChange(product.id, index + 1); }}
                      aria-label={`Rate ${index + 1} stars`}
                    >
                      <IconStar size={16} strokeWidth={2} fill={index < Math.floor(product.rating) ? '#f59e0b' : 'none'} color={index < Math.floor(product.rating) ? '#f59e0b' : '#d1d5db'} />
                    </button>
                  ))}
                  <span className="rating-value">{product.rating > 0 ? product.rating : '-'}</span>
                </div>
                <div className="repurchase-toggle product-card-repurchase">
                  <button type="button" className={`repurchase-btn ${product.wouldRepurchase ? 'yes' : ''}`} onClick={(e) => { e.stopPropagation(); handleWouldRepurchaseToggle(product.id, product.wouldRepurchase); }}>
                    {product.wouldRepurchase ? '✓ Would repurchase' : 'Would repurchase?'}
                  </button>
                </div>
                {product.expiryDate && (
                  <div className={`expiry-badge product-card-expiry ${isExpired(product.expiryDate) ? 'expired' : isExpiryApproaching(product.expiryDate) ? 'warning' : ''}`}>
                    {isExpired(product.expiryDate) ? 'Expired' : isExpiryApproaching(product.expiryDate) ? `Expires ${new Date(product.expiryDate).toLocaleDateString()}` : `Expires ${new Date(product.expiryDate).toLocaleDateString()}`}
                  </div>
                )}
                {product.notes && <p className="notes product-card-notes">{product.notes}</p>}
                <div className="product-actions product-card-actions-desk">
                  <select value={product.status} onChange={(e) => handleUpdateStatus(product.id, e.target.value as DisplayProduct['status'])} className="status-select">
                    <option value="using">Using</option>
                    <option value="wishlist">Wishlist</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                  <button type="button" className="btn-remove" onClick={() => handleRemoveProduct(product.id)}>Remove</button>
                </div>
                <div className="product-card-actions-mobile" ref={productMenuId === product.id ? productMenuRef : undefined}>
                  <button type="button" className="product-card-menu-btn" onClick={(e) => { e.stopPropagation(); setProductMenuId(productMenuId === product.id ? null : product.id); }} aria-label="Options" aria-expanded={productMenuId === product.id}>
                    <IconMoreVertical size={20} strokeWidth={2} />
                  </button>
                  {productMenuId === product.id && (
                    <div className="product-card-dropdown" role="menu">
                      <button type="button" role="menuitem" onClick={() => { handleUpdateStatus(product.id, 'using'); setProductMenuId(null); }}>Using</button>
                      <button type="button" role="menuitem" onClick={() => { handleUpdateStatus(product.id, 'wishlist'); setProductMenuId(null); }}>Wishlist</button>
                      <button type="button" role="menuitem" onClick={() => { handleUpdateStatus(product.id, 'discontinued'); setProductMenuId(null); }}>Done</button>
                      <button type="button" role="menuitem" className="product-card-dropdown-remove" onClick={() => { handleRemoveProduct(product.id); setProductMenuId(null); }}>
                        <IconTrash2 size={16} strokeWidth={2} /> Remove
                      </button>
                    </div>
                  )}
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

      <Link to="/scan?mode=product" className="myshelf-fab" aria-label="Add product to shelf">
        <IconPlus size={24} strokeWidth={2.5} />
      </Link>
      </div>
    </div>
  );
};

export default MyShelfPage;
