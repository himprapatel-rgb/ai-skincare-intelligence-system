import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconHeart, IconX, IconPackage, IconStar } from '../components/Icons';
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
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');

  useEffect(() => {
    // Mock data - replace with API call
    const mockFavorites: FavoriteProduct[] = [
      { id: '1', name: 'Hydrating Serum', brand: 'CeraVe', price: 24.99, image: '/placeholder.jpg', rating: 4.8, matchScore: 95, addedAt: '2026-01-10' },
      { id: '2', name: 'Vitamin C Serum', brand: 'The Ordinary', price: 12.99, image: '/placeholder.jpg', rating: 4.6, matchScore: 88, addedAt: '2026-01-08' },
      { id: '3', name: 'Retinol Cream', brand: 'Paula\'s Choice', price: 58.00, image: '/placeholder.jpg', rating: 4.9, matchScore: 92, addedAt: '2026-01-05' },
      { id: '4', name: 'SPF 50 Sunscreen', brand: 'La Roche-Posay', price: 34.99, image: '/placeholder.jpg', rating: 4.7, matchScore: 90, addedAt: '2026-01-01' },
    ];
    setFavorites(mockFavorites);
    setIsLoading(false);
  }, []);

  const handleRemove = (id: string) => {
    setFavorites(prev => prev.filter(p => p.id !== id));
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'price': return a.price - b.price;
      default: return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  if (isLoading) return <div className="page-container"><p>Loading favorites...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <IconHeart size={28} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          My Favorites
        </h1>
        <p>Your saved skincare products ({favorites.length} items)</p>
      </div>

      <div className="card favorites-toolbar">
        <div className="card-content favorites-toolbar-content">
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

      <div className="card favorites-explainer">
        <div className="card-content">
          <h3>What does Match % mean?</h3>
          <p>
            Match scores combine your skin goals, ingredient preferences, and past results.
            Higher scores indicate a better fit for your routine and concern profile.
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="card favorites-empty">
          <div className="card-content favorites-empty-content">
            <div className="favorites-empty-icon">
              <IconHeart size={48} strokeWidth={2} />
            </div>
            <h3>No Favorites Yet</h3>
            <p className="favorites-empty-text">Start adding products to your favorites list</p>
            <Link to="/recommendations" className="btn btn-primary favorites-empty-action">Browse Products</Link>
          </div>
        </div>
      ) : (
        <div className="favorites-grid">
          {sortedFavorites.map(product => (
            <div key={product.id} className="card">
              <div className="favorites-image">
                <span className="favorites-image-icon">
                  <IconPackage size={32} strokeWidth={2} />
                </span>
              </div>
              <div className="card-content">
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
                  <button onClick={() => handleRemove(product.id)} className="btn favorites-remove" title="Remove">
                    <IconX size={16} strokeWidth={2} />
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

export default FavoritesPage;
