import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  ingredients: string[];
  concerns: string[];
  imageUrl: string;
  purchaseUrl: string;
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
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app';
      
      const response = await fetch(`${API_BASE}/api/v1/recommendations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setProducts(data.recommendations || []);
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
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.concern !== 'all' && !product.concerns.includes(filters.concern)) return false;
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max && (product.price < min || product.price > max)) return false;
      if (!max && product.price < min) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Recommendations</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Product Recommendations</h1>
              <p className="text-gray-600">Personalized products based on your skin analysis</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="cleanser">Cleanser</option>
                <option value="moisturizer">Moisturizer</option>
                <option value="serum">Serum</option>
                <option value="sunscreen">Sunscreen</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="0-20">Under $20</option>
                <option value="20-50">$20 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100">Over $100</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skin Concern</label>
              <select
                value={filters.concern}
                onChange={(e) => setFilters({...filters, concern: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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

          <button
            onClick={() => setFilters({ category: 'all', priceRange: 'all', concern: 'all' })}
            className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Clear All Filters
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">No products match your filters. Try adjusting your selection.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full ${favorites.has(product.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'} hover:scale-110 transition`}
                  >
                    {favorites.has(product.id) ? '❤️' : '♡'}
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 uppercase">{product.category}</span>
                    <div className="flex items-center">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold ml-1">{product.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.brand}</p>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Key Concerns:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.concerns.slice(0, 3).map((concern, index) => (
                        <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-800">${product.price}</span>
                    <a
                      href={product.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                    >
                      Buy Now
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Summary */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
