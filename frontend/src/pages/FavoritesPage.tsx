import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

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
        <h1>❤️ My Favorites</h1>
        <p>Your saved skincare products ({favorites.length} items)</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ padding: '8px', marginLeft: '8px' }}>
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>
          <Link to="/recommendations" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>❤️</div>
            <h3>No Favorites Yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Start adding products to your favorites list</p>
            <Link to="/recommendations" className="btn btn-primary" style={{ marginTop: '24px' }}>Browse Products</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {sortedFavorites.map(product => (
            <div key={product.id} className="card">
              <div style={{ height: '160px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px' }}>🧟</span>
              </div>
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>{product.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{product.brand}</p>
                  </div>
                  <span style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {product.matchScore}% Match
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <span style={{ color: '#fbbf24' }}>★ {product.rating}</span>
                  <span style={{ fontWeight: 'bold' }}>€{product.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <Link to={`/product/${product.id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>View</Link>
                  <button onClick={() => handleRemove(product.id)} className="btn" style={{ background: 'var(--error-color)', color: 'white' }}>✕</button>
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
