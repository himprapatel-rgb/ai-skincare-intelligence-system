import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css';

interface ProductDetails {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  ingredients: string[];
  rating: number;
  reviews: number;
  price: string;
  imageUrl?: string;
  keyIngredients: string[];
  suitable: string[];
  concerns: string[];
  howToUse: string;
  benefits: string[];
}

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inShelf, setInShelf] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'reviews'>('overview');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/products/${id}`);
      // const data = await response.json();
      
      // Mock data
      const mockProduct: ProductDetails = {
        id: id || '1',
        name: 'Hydrating Serum with Hyaluronic Acid',
        brand: 'CeraVe',
        category: 'Serum',
        description: 'A lightweight, fast-absorbing serum that deeply hydrates and plumps skin with multiple forms of hyaluronic acid.',
        ingredients: ['Water', 'Glycerin', 'Hyaluronic Acid', 'Niacinamide', 'Ceramides', 'Vitamin B5'],
        rating: 4.5,
        reviews: 1247,
        price: '$24.99',
        imageUrl: '/placeholder.jpg',
        keyIngredients: ['Hyaluronic Acid', 'Ceramides', 'Niacinamide'],
        suitable: ['Normal', 'Dry', 'Combination'],
        concerns: ['Dehydration', 'Fine Lines', 'Dullness'],
        howToUse: 'Apply 2-3 drops to clean face morning and evening. Follow with moisturizer.',
        benefits: ['Deep hydration', 'Plumps skin', 'Reduces fine lines', 'Strengthens barrier']
      };
      
      setProduct(mockProduct);
      // Check if in shelf
      setInShelf(Math.random() > 0.5); // Mock
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShelf = async () => {
    try {
      // TODO: API call
      setInShelf(true);
    } catch (error) {
      console.error('Failed to add to shelf:', error);
    }
  };

  const handleRemoveFromShelf = async () => {
    try {
      // TODO: API call
      setInShelf(false);
    } catch (error) {
      console.error('Failed to remove from shelf:', error);
    }
  };

  if (loading) {
    return <div className="product-details-page"><div className="loading-spinner">Loading...</div></div>;
  }

  if (!product) {
    return <div className="product-details-page"><div className="error">Product not found</div></div>;
  }

  return (
    <div className="product-details-page">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="product-header">
        <div className="product-image-section">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="placeholder-image">No Image</div>
          )}
        </div>
        
        <div className="product-info-section">
          <h1>{product.name}</h1>
          <p className="brand">{product.brand}</p>
          <p className="category">{product.category}</p>
          
          <div className="rating-section">
            <div className="stars">
              {'★'.repeat(Math.floor(product.rating))}
              {'☆'.repeat(5 - Math.floor(product.rating))}
            </div>
            <span className="rating-text">{product.rating} ({product.reviews} reviews)</span>
          </div>
          
          <p className="price">{product.price}</p>
          <p className="description">{product.description}</p>
          
          <div className="product-tags">
            <div className="tag-group">
              <strong>Suitable for:</strong>
              {product.suitable.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
            <div className="tag-group">
              <strong>Concerns:</strong>
              {product.concerns.map(c => <span key={c} className="tag concern">{c}</span>)}
            </div>
          </div>
          
          <div className="action-buttons">
            {inShelf ? (
              <button className="btn-secondary" onClick={handleRemoveFromShelf}>
                Remove from Shelf
              </button>
            ) : (
              <button className="btn-primary" onClick={handleAddToShelf}>
                Add to My Shelf
              </button>
            )}
            <button className="btn-outline" onClick={() => navigate('/routine-builder')}>
              Add to Routine
            </button>
          </div>
        </div>
      </div>
      
      <div className="product-details-tabs">
        <div className="tabs-header">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'ingredients' ? 'active' : ''}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
          <button 
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <section>
                <h3>Key Benefits</h3>
                <ul>
                  {product.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                </ul>
              </section>
              
              <section>
                <h3>Key Ingredients</h3>
                <div className="key-ingredients">
                  {product.keyIngredients.map(ing => (
                    <div key={ing} className="ingredient-card">
                      <strong>{ing}</strong>
                    </div>
                  ))}
                </div>
              </section>
              
              <section>
                <h3>How to Use</h3>
                <p>{product.howToUse}</p>
              </section>
            </div>
          )}
          
          {activeTab === 'ingredients' && (
            <div className="ingredients-tab">
              <h3>Full Ingredient List</h3>
              <div className="ingredients-list">
                {product.ingredients.map((ing, idx) => (
                  <span key={idx} className="ingredient-item">{ing}</span>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <h3>Customer Reviews</h3>
              <p className="coming-soon">Reviews coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
