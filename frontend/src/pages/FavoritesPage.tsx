import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IconHeart, IconX, IconPackage, IconStar, IconSearch, IconRefresh } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonCardGrid, SkeletonHeading, SkeletonText } from '../components/Skeleton';
import { api } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import './CommonStyles.css';
import './FavoritesPage.css';

interface FavoriteProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  rating: number;
  matchScore: number;
  addedAt: string;
}

/**
 * Favorites Page (US-304)
 * Manage saved favorite skincare products
 */
const FavoritesPage: React.FC = () => {
  usePageTitle('Favorites');
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/favorites');
      const data = response.data;
      
      setFavorites(data.favorites.map((f: Record<string, unknown>) => ({
        id: String(f.id ?? ''),
        name: String(f.product_name ?? ''),
        brand: String(f.product_brand ?? 'Unknown'),
        price: Number(f.product_price ?? 0),
        image: String(f.product_image ?? '/placeholder.jpg'),
        rating: Number(f.product_rating ?? 0),
        matchScore: Number(f.match_score ?? 0),
        addedAt: (typeof f.created_at === 'string' ? f.created_at.split('T')[0] : '') || '',
      })));
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Failed to fetch favorites:', err);
      setFavorites([]);
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
      if (res?.status !== 401) {
        setError('Unable to load favorites. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    setConfirmRemoveId(id);
  };

  const doRemove = async () => {
    if (!confirmRemoveId) return;
    try {
      await api.delete(`/favorites/${confirmRemoveId}`);
      setFavorites(prev => prev.filter(p => p.id !== confirmRemoveId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      setFavorites(prev => prev.filter(p => p.id !== confirmRemoveId));
    } finally {
      setConfirmRemoveId(null);
    }
  };

  const sortedFavorites = useMemo(() => [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'price': return a.price - b.price;
      default: return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  }), [favorites, sortBy]);

  const searchFilteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return sortedFavorites;
    const q = searchTerm.toLowerCase().trim();
    return sortedFavorites.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [sortedFavorites, searchTerm]);

  if (isLoading) {
    return (
      <div className="favorites-page app-page">
        <header className="app-header-card favorites-header-row" style={{ marginBottom: 16 }}>
          <SkeletonHeading style={{ width: 200, height: 28 }} />
          <SkeletonText style={{ width: 160, marginTop: 8 }} />
        </header>
        <div className="app-page-content">
          <div className="app-card favorites-toolbar" style={{ marginBottom: 24 }}>
            <SkeletonText style={{ width: '100%', height: 48 }} />
          </div>
          <SkeletonCardGrid count={6} hasImage />
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page app-page">
      <header className="app-header-card favorites-header-row">
        <div>
          <h1>
            <IconHeart size={24} strokeWidth={2} className="favorites-header-icon" aria-hidden />
            My Favorites
          </h1>
          <p className="app-header-subtitle">Your saved products · {favorites.length} {favorites.length === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          type="button"
          className="favorites-refresh-btn"
          onClick={() => fetchFavorites()}
          disabled={isLoading}
          aria-label="Refresh list"
          title="Refresh"
        >
          <IconRefresh size={20} strokeWidth={2} className={isLoading ? 'spin' : ''} />
        </button>
      </header>
      <div className="app-page-content">
      <div className="app-card favorites-toolbar">
        <div className="favorites-toolbar-content">
          <div className="favorites-search" role="search">
            <IconSearch size={18} strokeWidth={2} className="favorites-search-icon" aria-hidden />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or brand..."
              aria-label="Search favorites by name or brand"
              className="favorites-search-input"
            />
            {searchTerm.length > 0 && (
              <button type="button" className="favorites-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
                <IconX size={18} strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="favorites-sort">
            <label>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'price')}>
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>
          <Link to="/recommendations" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>

      <div className="app-card favorites-explainer">
        <h3>What does Match % mean?</h3>
        <p className="favorites-explainer-p">
          Match scores use your skin goals, ingredients you prefer, and past results.
          Higher scores mean a better fit for your routine.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="app-card app-empty-state favorites-empty">
          <div className="app-empty-state-icon"><IconHeart size={32} strokeWidth={2} /></div>
          <h3>No Favorites Yet</h3>
          <p>Add products from recommendations to see them here.</p>
          <Link to="/recommendations" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {searchFilteredFavorites.length === 0 ? (
            <div className="app-card app-empty-state favorites-empty-search">
              <p>No favorites match &quot;{searchTerm}&quot;. Try different words or <Link to="/recommendations">browse products</Link>.</p>
              <button type="button" className="btn btn-secondary" onClick={() => setSearchTerm('')}>Clear search</button>
            </div>
          ) : searchFilteredFavorites.map(product => (
            <div key={product.id} className="app-card favorites-product-card">
              <div className="favorites-image">
                <span className="favorites-image-icon">
                  <IconPackage size={32} strokeWidth={2} />
                </span>
              </div>
              <div className="favorites-card-content">
                <div className="favorites-header">
                  <div>
                    <h4 className="favorites-title">{product.name}</h4>
                    <p className="favorites-brand">{product.brand}</p>
                  </div>
                  <span className="favorites-match">
                    {product.matchScore}% Match
                  </span>
                </div>
                <div className="favorites-meta">
                  <span className="favorites-rating">
                    <IconStar size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {product.rating}
                  </span>
                  <span className="favorites-price">€{product.price.toFixed(2)}</span>
                </div>
                <div className="favorites-actions">
                  <Link to={`/product/${product.id}`} className="btn btn-secondary favorites-action-link">View</Link>
                  <button onClick={() => handleRemove(product.id)} className="btn favorites-remove" type="button" title="Remove from favorites" aria-label="Remove from favorites">
                    <IconX size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
      <ConfirmModal
        open={!!confirmRemoveId}
        title="Remove from favorites"
        message="Remove this product from your favorites? You can add it again from recommendations."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={doRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
};

export default FavoritesPage;
