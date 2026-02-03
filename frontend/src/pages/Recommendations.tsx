import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconStar, IconAlertTriangle, IconHeart, IconArrowLeft, IconPackage } from '../components/Icons';
import { SkeletonCardGrid } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import './Recommendations.css';

const SHELF_STORAGE_KEY = 'shelf_products';
const COMPARE_IDS_KEY = 'compare_product_ids';
const MAX_COMPARE = 4;

function getCompareIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToCompareList(productId: string): string[] {
  try {
    const list = getCompareIds().filter((id) => id !== productId);
    const next = [productId, ...list].slice(0, MAX_COMPARE);
    localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getCompareIds();
  }
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price?: number | null;
  rating?: number | null;
  ingredients: string[];
  concerns: string[];
  imageUrl?: string | null;
  purchaseUrl?: string | null;
}

const Recommendations: React.FC = () => {
  usePageTitle('Recommendations');
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [shelfIds, setShelfIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>(getCompareIds);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    concern: 'all'
  });
  const fallbackProducts: Product[] = [
    {
      id: 'fallback-1',
      name: 'Barrier Repair Moisturizer',
      brand: 'SkinCareAI Lab',
      category: 'moisturizer',
      price: 38,
      rating: 4.6,
      ingredients: ['Ceramides', 'Squalane'],
      concerns: ['dryness', 'redness'],
      imageUrl: null,
      purchaseUrl: null
    },
    {
      id: 'fallback-2',
      name: 'Brightening Vitamin C Serum',
      brand: 'Derm Essentials',
      category: 'serum',
      price: 42,
      rating: 4.4,
      ingredients: ['Vitamin C', 'Ferulic Acid'],
      concerns: ['dark spots', 'dullness'],
      imageUrl: null,
      purchaseUrl: null
    },
    {
      id: 'fallback-3',
      name: 'Calming Daily Cleanser',
      brand: 'Pure Balance',
      category: 'cleanser',
      price: 18,
      rating: 4.3,
      ingredients: ['Oat', 'Glycerin'],
      concerns: ['sensitivity', 'dryness'],
      imageUrl: null,
      purchaseUrl: null
    },
    {
      id: 'fallback-4',
      name: 'Lightweight SPF 50',
      brand: 'GlowShield',
      category: 'sunscreen',
      price: 28,
      rating: 4.5,
      ingredients: ['Zinc Oxide', 'Niacinamide'],
      concerns: ['oiliness', 'redness'],
      imageUrl: null,
      purchaseUrl: null
    }
  ];

  useEffect(() => {
    fetchRecommendations();
    loadFavorites();
    loadShelfIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = (data as { detail?: string }).detail || `Failed to fetch (${response.status})`;
        throw new Error(msg);
      }

      const data = await response.json();
      const items = (data.recommendations || []).map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        brand: String(item.brand || ''),
        category: String(item.category || ''),
        price: typeof item.price === 'number' ? item.price : (typeof item.price_usd === 'number' ? item.price_usd : null),
        rating: typeof item.rating === 'number' ? item.rating : (typeof item.average_rating === 'number' ? item.average_rating : null),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients.filter((value) => typeof value === 'string') : [],
        concerns: Array.isArray(item.concerns) ? item.concerns.filter((value) => typeof value === 'string') : [],
        imageUrl: typeof item.image_url === 'string' ? item.image_url : (typeof item.imageUrl === 'string' ? item.imageUrl : null),
        purchaseUrl: typeof item.purchase_url === 'string' ? item.purchase_url : (typeof item.purchaseUrl === 'string' ? item.purchaseUrl : null),
      }));
      setProducts(items.length > 0 ? items : fallbackProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts(fallbackProducts);
      toast.info('Showing sample recommendations. Sign in for personalized picks.');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const loadShelfIds = () => {
    try {
      const raw = localStorage.getItem(SHELF_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(list)
        ? (list as { id?: string }[]).map((p) => p?.id).filter((id): id is string => typeof id === 'string')
        : [];
      setShelfIds(new Set(ids));
    } catch {
      setShelfIds(new Set());
    }
  };

  const addToShelf = (product: Product) => {
    if (shelfIds.has(product.id)) {
      toast.success('Already on your shelf');
      return;
    }
    try {
      const raw = localStorage.getItem(SHELF_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entry = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        rating: product.rating ?? null,
        status: 'using',
        notes: '',
        addedDate: new Date().toISOString(),
        imageUrl: product.imageUrl ?? null,
      };
      const next = Array.isArray(list) ? [...list, entry] : [entry];
      localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(next));
      setShelfIds((prev) => new Set([...prev, product.id]));
      toast.success('Added to My Shelf');
    } catch {
      toast.error('Could not add to shelf');
    }
  };

  const handleAddToCompare = (productId: string) => {
    setCompareIds(addToCompareList(productId));
    toast.success('Added to compare list');
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category.toLowerCase() !== filters.category) return false;
    if (
      filters.concern !== 'all' &&
      !product.concerns.map((concern) => concern.toLowerCase()).includes(filters.concern)
    ) {
      return false;
    }
    if (filters.priceRange !== 'all') {
      if (product.price == null) return false;
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max && (product.price < min || product.price > max)) return false;
      if (!max && product.price < min) return false;
    }
    return true;
  });
  const hasFilters =
    filters.category !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.concern !== 'all';
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products.slice(0, 4);

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

  if (loading) {
    return (
      <div className="recommendations-page app-page">
        <div className="recommendations-container app-page-content">
          <div className="recommendations-state recommendations-skeleton">
            <div className="skeleton skeleton-heading" style={{ width: 200, height: 28, marginBottom: 24 }} />
            <SkeletonCardGrid count={6} hasImage={true} />
          </div>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="recommendations-page app-page">
        <div className="recommendations-container app-page-content">
          <div className="recommendations-state error">
            <div className="recommendations-error">
              <div className="error-icon">
                <IconAlertTriangle size={48} strokeWidth={2} />
              </div>
              <h2>Error loading recommendations</h2>
              <p>{error}</p>
              <button
                onClick={() => { setError(null); fetchRecommendations(); }}
                className="btn-primary"
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page app-page">
      <header className="app-header-card recommendations-header">
        <div className="recommendations-header-text">
          <h1>
            Product <span className="gradient-text">Recommendations</span>
          </h1>
          <p className="app-header-subtitle">
            {error && products.length > 0
              ? 'Sample picks — sign in for personalized recommendations.'
              : 'Personalized picks based on your latest skin analysis.'}
          </p>
        </div>
        <Link to="/dashboard" className="btn-secondary back-button recommendations-back">
          <IconArrowLeft size={18} strokeWidth={2} />
          Back to Dashboard
        </Link>
      </header>
      <div className="recommendations-container app-page-content">
        <div className="recommendations-geo-banner" role="region" aria-label="Product region and ingredients">
          <p className="recommendations-geo-ingredients">
            <span className="recommendations-geo-label">🧪 Finding products with:</span>
            <span className="recommendations-geo-chips">
              <span className="recommendations-geo-chip">💧 Hyaluronic</span>
              <span className="recommendations-geo-chip">🍊 Vit C</span>
              <span className="recommendations-geo-chip">☕ Caffeine</span>
            </span>
          </p>
          <p className="recommendations-geo-region">
            📍 Showing: Ireland prices from Amazon.co.uk
          </p>
        </div>
        <div className={`recommendations-filters ${hasFilters ? 'has-active-filters' : ''}`}>
          <div className="filters-header">
            <h2>Filters</h2>
            <button
              onClick={() => setFilters({ category: 'all', priceRange: 'all', concern: 'all' })}
              className="filters-reset"
              type="button"
            >
              Clear all
            </button>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="cleanser">Cleanser</option>
                <option value="moisturizer">Moisturizer</option>
                <option value="serum">Serum</option>
                <option value="sunscreen">Sunscreen</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-price">Price Range</label>
              <select
                id="filter-price"
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="0-20">Under $20</option>
                <option value="20-50">$20 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100">Over $100</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-concern">Skin Concern</label>
              <select
                id="filter-concern"
                value={filters.concern}
                onChange={(e) => setFilters({ ...filters, concern: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Concerns</option>
                <option value="acne">Acne</option>
                <option value="wrinkles">Wrinkles</option>
                <option value="dark spots">Dark Spots</option>
                <option value="dryness">Dryness</option>
                <option value="oiliness">Oiliness</option>
              </select>
            </div>
          </div>
        </div>

        <div className="product-grid">
          {displayProducts.length === 0 ? (
            <div className="empty-recommendations">
              <div className="empty-icon">
                <IconAlertTriangle size={64} strokeWidth={2} />
              </div>
              <h3>No products match your filters</h3>
              <p>Try a broader category or a different concern.</p>
              {hasFilters && (
                <button
                  type="button"
                  className="btn-primary empty-reset-filters"
                  onClick={() => setFilters({ category: 'all', priceRange: 'all', concern: 'all' })}
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            displayProducts.map((product, index) => (
              <div
                key={product.id}
                className={`product-card ${index === 0 ? 'product-card-best-match' : ''}`}
              >
                {index === 0 && (
                  <span className="product-card-best-badge">🏆 Best match</span>
                )}
                <div className="product-media">
                  <img
                    src={product.imageUrl || placeholderImage}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                    width={240}
                    height={240}
                    onError={(event) => {
                      const target = event.currentTarget;
                      if (target.src !== placeholderImage) {
                        target.src = placeholderImage;
                      }
                    }}
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`favorite-button ${favorites.has(product.id) ? 'active' : ''}`}
                    title={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={`${favorites.has(product.id) ? 'Remove' : 'Add'} ${product.name} ${favorites.has(product.id) ? 'from' : 'to'} favorites`}
                    type="button"
                  >
                    <IconHeart
                      size={18}
                      strokeWidth={2}
                      fill={favorites.has(product.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="product-content">
                  <div className="product-meta">
                    <span className="product-category">{product.category}</span>
                    <div className="product-rating">
                      <IconStar size={16} strokeWidth={2} />
                      <span>{product.rating ?? 'N/A'}</span>
                    </div>
                  </div>

                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-brand">{product.brand}</p>

                  <div className="product-concerns">
                    <p>Key concerns</p>
                    <div className="concern-tags">
                      {product.concerns.length > 0 ? (
                        product.concerns.slice(0, 3).map((concern, index) => (
                          <span key={index} className="concern-tag">
                            {concern}
                          </span>
                        ))
                      ) : (
                        <span className="concern-tag empty">No tagged concerns</span>
                      )}
                    </div>
                  </div>

                  <div className="product-price">
                    <span className="price-value">
                      {product.price != null ? `$${product.price}` : 'Price N/A'}
                    </span>
                    <div className="product-actions-row">
                      <button
                        type="button"
                        className={`btn-add-to-shelf ${shelfIds.has(product.id) ? 'on-shelf' : ''}`}
                        onClick={() => addToShelf(product)}
                        disabled={shelfIds.has(product.id)}
                        title={shelfIds.has(product.id) ? 'Already on shelf' : 'Add to shelf'}
                        aria-label={shelfIds.has(product.id) ? `${product.name} already on shelf` : `Add ${product.name} to shelf`}
                      >
                        <IconPackage size={16} strokeWidth={2} />
                        {shelfIds.has(product.id) ? 'On shelf' : 'Add to shelf'}
                      </button>
                      <button
                        type="button"
                        className={`btn-add-to-compare ${compareIds.includes(product.id) ? 'in-compare' : ''}`}
                        onClick={() => handleAddToCompare(product.id)}
                        disabled={compareIds.includes(product.id)}
                        title={compareIds.includes(product.id) ? 'In compare list' : 'Add to compare'}
                        aria-label={compareIds.includes(product.id) ? `${product.name} in compare list` : `Add ${product.name} to compare`}
                      >
                        {compareIds.includes(product.id) ? 'In compare' : 'Compare'}
                      </button>
                      {product.purchaseUrl ? (
                        <a
                          href={product.purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-add"
                        >
                          Buy Now
                        </a>
                      ) : (
                        <Link
                        to={`/product/${encodeURIComponent(product.id)}`}
                        state={{ product: { id: product.id, name: product.name, brand: product.brand, category: product.category, ingredients: product.ingredients || [], concerns: product.concerns || [], imageUrl: product.imageUrl, rating: product.rating, price: product.price } }}
                        className="btn-add btn-view-details"
                      >
                        View details
                      </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {displayProducts.length > 0 && (
          <div className="results-summary">
            {filteredProducts.length > 0
              ? `Showing ${filteredProducts.length} of ${products.length} products`
              : hasFilters
              ? 'Showing fallback picks. Clear filters to see more.'
              : `Showing ${displayProducts.length} of ${products.length} products`}
          </div>
        )}
        {filteredProducts.length === 0 && hasFilters && (
          <div className="results-summary">
            <button
              className="filters-reset"
              type="button"
              onClick={() => setFilters({ category: 'all', priceRange: 'all', concern: 'all' })}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
