import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconStar, IconAlertTriangle, IconHeart, IconArrowLeft } from '../components/Icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './Recommendations.css';

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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    concern: 'all'
  });

  useEffect(() => {
    fetchRecommendations();
    loadFavorites();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/recommendations`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
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
      setProducts(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  const placeholderImage =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#e6efff"/><stop offset="100%" stop-color="#f8fbff"/>' +
        '</linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#g)"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7d99" font-size="20" font-family="Arial, sans-serif">' +
        'No Image' +
        '</text>' +
      '</svg>'
    );

  if (loading) {
    return (
      <div className="recommendations-page">
        <div className="recommendations-container">
          <div className="recommendations-state">
            <LoadingSpinner message="Loading recommendations..." size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-page">
        <div className="recommendations-container">
          <div className="recommendations-state error">
            <div className="recommendations-error">
              <div className="error-icon">
                <IconAlertTriangle size={48} strokeWidth={2} />
              </div>
              <h2>Error loading recommendations</h2>
              <p>{error}</p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
                type="button"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="recommendations-container">
        <div className="recommendations-header">
          <div>
            <h1>
              Product <span className="gradient-text">Recommendations</span>
            </h1>
            <p>Personalized picks based on your latest skin analysis.</p>
          </div>
          <Link to="/dashboard" className="btn-secondary back-button">
            <IconArrowLeft size={18} strokeWidth={2} />
            Back to Dashboard
          </Link>
        </div>

        <div className="recommendations-filters">
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
          {filteredProducts.length === 0 ? (
            <div className="empty-recommendations">
              <div className="empty-icon">
                <IconAlertTriangle size={64} strokeWidth={2} />
              </div>
              <h3>No products match your filters</h3>
              <p>Try a broader category or a different concern.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-media">
                  <img
                    src={product.imageUrl || placeholderImage}
                    alt={product.name}
                    className="product-image"
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
                      <button type="button" className="btn-disabled" disabled>
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="results-summary">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
