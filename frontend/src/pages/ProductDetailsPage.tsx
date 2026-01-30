import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { IconArrowLeft, IconStar } from '../components/Icons';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';
import LoadingScreen from '../components/LoadingScreen';
import { usePageTitle } from '../hooks/usePageTitle';
import { useShelf } from '../context/ShelfContext';
import './ProductDetailsPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

interface ProductDetails {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  ingredients: string[];
  rating?: number;        // Optional - only show if we have real data
  reviews?: number;       // Optional - only show if we have real data
  price?: string;         // Optional - only show if we have real data
  imageUrl?: string;
  keyIngredients?: string[];
  suitable?: string[];
  concerns?: string[];
  howToUse?: string;
  benefits?: string[];
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

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const COMPARE_IDS_KEY = 'compare_product_ids';
const MAX_RECENT = 10;
const MAX_COMPARE = 4;

function addToRecentlyViewed(item: { id: string; name: string; brand: string; imageUrl?: string }) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const list: Array<{ id: string; name: string; brand: string; imageUrl?: string; viewedAt: string }> = raw ? JSON.parse(raw) : [];
    const next = [{ ...item, viewedAt: new Date().toISOString() }, ...list.filter((p) => p.id !== item.id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function getCompareIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToCompare(productId: string): string[] {
  try {
    const list = getCompareIds().filter((id) => id !== productId);
    const next = [productId, ...list].slice(0, MAX_COMPARE);
    localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getCompareIds();
  }
}

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products: shelfProducts, isOnShelf, addToShelf, removeFromShelf } = useShelf();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inShelf, setInShelf] = useState(false);
  const [shelfActionLoading, setShelfActionLoading] = useState(false);
  usePageTitle(
    product ? product.name : 'Product Details',
    product ? `${product.name} by ${product.brand}. ${product.category}. ${product.description?.slice(0, 120) || ''}` : null
  );
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
  const [imageZoomed, setImageZoomed] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>(() => getCompareIds());

  const handleAddToCompare = () => {
    if (!product?.id) return;
    setCompareIds(addToCompare(product.id));
  };

  const fetchProductDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // First, check if product is on user's shelf
      const shelfProduct = shelfProducts.find(p => 
        p.id === id || p.product_id === id || p.external_product_id === id
      );
      
      if (shelfProduct) {
        // Product found on shelf - use that data
        // Extract ingredients from ingredients_json if available
        const ingredientsSnapshot = shelfProduct.ingredients_json;
        const ingredients = ingredientsSnapshot?.ingredients || [];
        const keyIngredients = ingredientsSnapshot?.key_ingredients?.map(ki => 
          ki.percentage ? `${ki.name} ${ki.percentage}` : ki.name
        ) || [];
        
        const productData: ProductDetails = {
          id: shelfProduct.id,
          name: shelfProduct.product_name,
          brand: shelfProduct.product_brand || 'Unknown Brand',
          category: shelfProduct.product_category || 'Skincare',
          description: shelfProduct.notes || undefined,
          ingredients: ingredients,
          keyIngredients: keyIngredients.length > 0 ? keyIngredients : undefined,
          imageUrl: shelfProduct.product_image,
          // No fake ratings/reviews/prices - only show if we have real data
        };
        setProduct(productData);
        setInShelf(true);
        addToRecentlyViewed({
          id: productData.id,
          name: productData.name,
          brand: productData.brand,
          imageUrl: productData.imageUrl,
        });
      } else {
        // Try to fetch from products API
        try {
          const response = await fetch(`${API_BASE}/products/${id}`);
          if (response.ok) {
            const data = await response.json();
            const productData: ProductDetails = {
              id: data.id || id,
              name: data.name || data.product_name || 'Unknown Product',
              brand: data.brand || data.product_brand || 'Unknown Brand',
              category: data.category || data.product_category || 'Skincare',
              description: data.description,
              ingredients: data.ingredients || [],
              imageUrl: data.image_url || data.product_image,
              // Only include rating if it's real data from API
              rating: data.average_rating || undefined,
              reviews: data.review_count || undefined,
              price: data.price || undefined,
              keyIngredients: data.key_ingredients,
              suitable: data.suitable_skin_types,
              concerns: data.addresses_concerns,
              howToUse: data.how_to_use,
              benefits: data.benefits,
            };
            setProduct(productData);
            setInShelf(isOnShelf(id));
            addToRecentlyViewed({
              id: productData.id,
              name: productData.name,
              brand: productData.brand,
              imageUrl: productData.imageUrl,
            });
          } else {
            // Product not found - show basic info
            setProduct({
              id: id,
              name: 'Product Not Found',
              brand: 'Unknown',
              category: 'Unknown',
              ingredients: [],
            });
          }
        } catch {
          // API error - show basic info
          setProduct({
            id: id,
            name: 'Product Details Unavailable',
            brand: 'Unknown',
            category: 'Unknown',
            ingredients: [],
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, shelfProducts, isOnShelf]);

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
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Failed to submit review:', error);
      const res = error && typeof error === 'object' && 'response' in error ? (error as { response?: { status?: number } }).response : undefined;
      if (res?.status === 400) {
        setReviewError('You have already reviewed this product.');
      } else if (res?.status === 401) {
        setReviewError('Please log in to submit a review.');
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToShelf = async () => {
    if (!product) return;
    setShelfActionLoading(true);
    try {
      const success = await addToShelf({
        product_id: product.id,
        product_name: product.name,
        product_brand: product.brand,
        product_category: product.category,
        product_image: product.imageUrl,
        status: 'active',
      });
      if (success) {
        setInShelf(true);
      }
    } catch (error) {
      console.error('Failed to add to shelf:', error);
    } finally {
      setShelfActionLoading(false);
    }
  };

  const handleRemoveFromShelf = async () => {
    if (!product) return;
    setShelfActionLoading(true);
    try {
      // Find the shelf product ID
      const shelfProduct = shelfProducts.find(p => 
        p.id === product.id || p.product_id === product.id
      );
      if (shelfProduct) {
        const success = await removeFromShelf(shelfProduct.id);
        if (success) {
          setInShelf(false);
        }
      }
    } catch (error) {
      console.error('Failed to remove from shelf:', error);
    } finally {
      setShelfActionLoading(false);
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
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Recommendations', path: '/recommendations' },
          { name: product.name, path: `/product/${id}` },
        ]}
      />
      <div className="product-details-actions-row">
        <button className="back-button" onClick={() => navigate(-1)}>
          <IconArrowLeft size={16} strokeWidth={2} className="icon-inline" />
          Back
        </button>
        {compareIds.length >= 2 && (
          <Link to={`/product/compare?ids=${compareIds.slice(0, 4).join(',')}`} className="compare-link">
            Compare ({compareIds.length})
          </Link>
        )}
      </div>
      <div className="product-header">
        <div className="product-image-section">
          {product.imageUrl ? (
            <>
              <button type="button" className="product-image-zoom-trigger" onClick={() => setImageZoomed(true)} aria-label="Zoom product image">
                <img src={product.imageUrl} alt={product.name} loading="lazy" width={320} height={320} />
              </button>
              {imageZoomed && (
                <div className="product-image-zoom-overlay" role="dialog" aria-modal="true" aria-label="Enlarged product image" onClick={() => setImageZoomed(false)}>
                  <button type="button" className="product-image-zoom-close" onClick={() => setImageZoomed(false)} aria-label="Close zoom">×</button>
                  <img src={product.imageUrl} alt={product.name} onClick={(e) => e.stopPropagation()} />
                </div>
              )}
            </>
          ) : (
            <div className="placeholder-image">
              <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="productGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <rect x="10" y="0" width="60" height="85" rx="8" fill="url(#productGrad)" opacity="0.9"/>
                <rect x="18" y="8" width="44" height="16" rx="4" fill="white" opacity="0.3"/>
                <circle cx="40" cy="55" r="14" fill="white" opacity="0.2"/>
              </svg>
              <span>Product Image</span>
            </div>
          )}
        </div>
        
        <div className="product-info-section">
          <h1>{product.name}</h1>
          <p className="brand">{product.brand}</p>
          <p className="category">{product.category}</p>
          
          {/* Only show rating if we have real data */}
          {product.rating !== undefined && product.rating > 0 && (
            <div className="rating-section">
              <div className="stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <IconStar
                    key={index}
                    size={16}
                    strokeWidth={2}
                    fill={index < Math.floor(product.rating!) ? 'currentColor' : 'none'}
                    className="star-icon"
                  />
                ))}
              </div>
              <span className="rating-text">
                {product.rating} {product.reviews ? `(${product.reviews} reviews)` : ''}
              </span>
            </div>
          )}
          
          {/* Only show price if we have real data */}
          {product.price && <p className="price">{product.price}</p>}
          
          {product.description && <p className="description">{product.description}</p>}
          
          {/* Only show tags if we have real data */}
          {((product.suitable && product.suitable.length > 0) || (product.concerns && product.concerns.length > 0)) && (
            <div className="product-tags">
              {product.suitable && product.suitable.length > 0 && (
                <div className="tag-group">
                  <strong>Suitable for:</strong>
                  {product.suitable.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              )}
              {product.concerns && product.concerns.length > 0 && (
                <div className="tag-group">
                  <strong>Concerns:</strong>
                  {product.concerns.map(c => <span key={c} className="tag concern">{c}</span>)}
                </div>
              )}
            </div>
          )}
          
          <div className="action-buttons">
            {inShelf ? (
              <button 
                className="btn-secondary" 
                onClick={handleRemoveFromShelf}
                disabled={shelfActionLoading}
              >
                {shelfActionLoading ? 'Removing...' : 'Remove from Shelf'}
              </button>
            ) : (
              <>
                <button 
                  className="btn-primary" 
                  onClick={handleAddToShelf}
                  disabled={shelfActionLoading}
                >
                  {shelfActionLoading ? 'Adding...' : 'Add to My Shelf'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleAddToCompare} disabled={compareIds.includes(product.id)}>
                  {compareIds.includes(product.id) ? 'In compare list' : 'Add to compare'}
                </button>
              </>
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
              {product.benefits && product.benefits.length > 0 && (
                <section>
                  <h3>Key Benefits</h3>
                  <ul>
                    {product.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                  </ul>
                </section>
              )}
              
              {product.keyIngredients && product.keyIngredients.length > 0 && (
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
              )}
              
              {product.howToUse && (
                <section>
                  <h3>How to Use</h3>
                  <p>{product.howToUse}</p>
                </section>
              )}

              {/* Show message if no detailed info available */}
              {!product.benefits?.length && !product.keyIngredients?.length && !product.howToUse && (
                <section className="no-data-message">
                  <p>Detailed product information is not yet available for this product.</p>
                  <p>You can help by adding notes to this product from your shelf.</p>
                </section>
              )}
            </div>
          )}
          
          {activeTab === 'ingredients' && (
            <div className="ingredients-tab">
              <h3>Full Ingredient List</h3>
              {product.ingredients && product.ingredients.length > 0 ? (
                <div className="ingredients-list">
                  {product.ingredients.map((ing, idx) => (
                    <span key={idx} className="ingredient-item">{ing}</span>
                  ))}
                </div>
              ) : (
                <div className="no-ingredients-message">
                  <p>Ingredient list not available for this product.</p>
                  <p>Tips to get ingredient data:</p>
                  <ul>
                    <li>Scan the product again with the ingredients list visible in the photo</li>
                    <li>Use barcode scanning for products in our database</li>
                    <li>Take a clear photo of the back label showing all ingredients</li>
                  </ul>
                </div>
              )}
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
