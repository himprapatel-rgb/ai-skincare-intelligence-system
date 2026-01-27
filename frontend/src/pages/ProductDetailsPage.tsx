import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { IconArrowLeft, IconStar } from '../components/Icons';
import LoadingScreen from '../components/LoadingScreen';
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

interface Review {
  id: string;
  user_id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  skin_type: string | null;
  would_recommend: boolean;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_display_name: string | null;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
}

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inShelf, setInShelf] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'reviews'>('overview');
  
  // Reviews state
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    skin_type: '',
    would_recommend: true
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchProductDetails = useCallback(async () => {
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
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const response = await api.get(`/products/${id}/reviews`);
      setReviewsData(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === 'reviews' && !reviewsData) {
      fetchReviews();
    }
  }, [activeTab, reviewsData, fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSubmittingReview(true);
    setReviewError('');
    
    try {
      await api.post(`/products/${id}/reviews`, newReview);
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', comment: '', skin_type: '', would_recommend: true });
      // Refresh reviews
      fetchReviews();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      if (error.response?.status === 400) {
        setReviewError('You have already reviewed this product.');
      } else if (error.response?.status === 401) {
        setReviewError('Please log in to submit a review.');
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
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
      <button className="back-button" onClick={() => navigate(-1)}>
        <IconArrowLeft size={16} strokeWidth={2} className="icon-inline" />
        Back
      </button>
      
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
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar
                  key={index}
                  size={16}
                  strokeWidth={2}
                  fill={index < Math.floor(product.rating) ? 'currentColor' : 'none'}
                  className="star-icon"
                />
              ))}
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
              <div className="reviews-header">
                <h3>Customer Reviews</h3>
                <button 
                  className="btn-primary write-review-btn"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? 'Cancel' : 'Write a Review'}
                </button>
              </div>
              
              {showReviewForm && (
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="star-rating-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                        >
                          <IconStar
                            size={24}
                            strokeWidth={2}
                            fill={star <= newReview.rating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="review-title">Title (optional)</label>
                    <input
                      id="review-title"
                      type="text"
                      value={newReview.title}
                      onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                      placeholder="Summarize your experience"
                      maxLength={200}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="review-comment">Your Review</label>
                    <textarea
                      id="review-comment"
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      maxLength={2000}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="skin-type">Your Skin Type</label>
                      <select
                        id="skin-type"
                        value={newReview.skin_type}
                        onChange={(e) => setNewReview({ ...newReview, skin_type: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="Dry">Dry</option>
                        <option value="Oily">Oily</option>
                        <option value="Combination">Combination</option>
                        <option value="Normal">Normal</option>
                        <option value="Sensitive">Sensitive</option>
                      </select>
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newReview.would_recommend}
                          onChange={(e) => setNewReview({ ...newReview, would_recommend: e.target.checked })}
                        />
                        I would recommend this product
                      </label>
                    </div>
                  </div>
                  
                  {reviewError && <div className="error-message">{reviewError}</div>}
                  
                  <button type="submit" className="btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
              
              {reviewsLoading ? (
                <LoadingScreen message="Loading reviews" fullscreen={false} />
              ) : reviewsData && reviewsData.reviews.length > 0 ? (
                <>
                  <div className="reviews-summary">
                    <div className="avg-rating">
                      <span className="big-rating">{reviewsData.average_rating}</span>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconStar
                            key={star}
                            size={16}
                            strokeWidth={2}
                            fill={star <= Math.round(reviewsData.average_rating) ? 'currentColor' : 'none'}
                            className="star-icon"
                          />
                        ))}
                      </div>
                      <span className="total-reviews">{reviewsData.total} reviews</span>
                    </div>
                    <div className="rating-bars">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="rating-bar-row">
                          <span>{rating} star</span>
                          <div className="bar-bg">
                            <div 
                              className="bar-fill" 
                              style={{ 
                                width: `${reviewsData.total > 0 
                                  ? (reviewsData.rating_distribution[rating] / reviewsData.total) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span>{reviewsData.rating_distribution[rating]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="reviews-list">
                    {reviewsData.reviews.map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <div className="review-user">
                            <span className="user-name">{review.user_display_name || 'Anonymous'}</span>
                            {review.verified_purchase && (
                              <span className="verified-badge">Verified</span>
                            )}
                          </div>
                          <div className="review-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <IconStar
                                key={star}
                                size={14}
                                strokeWidth={2}
                                fill={star <= review.rating ? 'currentColor' : 'none'}
                                className="star-icon"
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && <h4 className="review-title">{review.title}</h4>}
                        {review.comment && <p className="review-comment">{review.comment}</p>}
                        <div className="review-meta">
                          {review.skin_type && <span className="skin-type">Skin type: {review.skin_type}</span>}
                          {review.would_recommend && <span className="would-recommend">Would recommend</span>}
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-reviews">
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
