import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { IconStar } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { usePageTitle } from '../hooks/usePageTitle';
import './ProductComparePage.css';

interface CompareProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  rating: number;
  ingredients: string[];
  concerns: string[];
  imageUrl?: string;
}

const MOCK_PRODUCTS: Record<string, CompareProduct> = {
  '1': {
    id: '1',
    name: 'Hydrating Serum with Hyaluronic Acid',
    brand: 'CeraVe',
    category: 'Serum',
    price: '$24.99',
    rating: 4.5,
    ingredients: ['Water', 'Glycerin', 'Hyaluronic Acid', 'Niacinamide', 'Ceramides', 'Vitamin B5'],
    concerns: ['Dehydration', 'Fine Lines', 'Dullness'],
  },
  '2': {
    id: '2',
    name: 'Barrier Repair Moisturizer',
    brand: 'SkinCareAI Lab',
    category: 'Moisturizer',
    price: '$38.00',
    rating: 4.6,
    ingredients: ['Ceramides', 'Squalane', 'Cholesterol'],
    concerns: ['Dryness', 'Redness'],
  },
  '3': {
    id: '3',
    name: 'Brightening Vitamin C Serum',
    brand: 'Derm Essentials',
    category: 'Serum',
    price: '$42.00',
    rating: 4.4,
    ingredients: ['Vitamin C', 'Ferulic Acid', 'Vitamin E'],
    concerns: ['Dark Spots', 'Dullness'],
  },
  '4': {
    id: '4',
    name: 'Calming Daily Cleanser',
    brand: 'Pure Balance',
    category: 'Cleanser',
    price: '$18.00',
    rating: 4.3,
    ingredients: ['Oat', 'Glycerin', 'Niacinamide'],
    concerns: ['Sensitivity', 'Dryness'],
  },
};

function getProduct(id: string): CompareProduct | null {
  return MOCK_PRODUCTS[id] ?? { id, name: `Product ${id}`, brand: '—', category: '—', price: '—', rating: 0, ingredients: [], concerns: [] };
}

const ProductComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4), [idsParam]);
  const [products, setProducts] = useState<CompareProduct[]>([]);

  usePageTitle('Compare Products', 'Side-by-side product comparison.');

  useEffect(() => {
    setProducts(ids.map((id) => getProduct(id)).filter((p): p is CompareProduct => p !== null));
  }, [ids]);

  if (ids.length < 2) {
    return (
      <div className="product-compare-page">
        <div className="product-compare-container">
          <h1>Compare Products</h1>
          <p className="compare-empty-desc">Add at least 2 products to compare. Use &quot;Add to compare&quot; on product pages or recommendations.</p>
          <Link to="/recommendations" className="btn-primary">Browse recommendations</Link>
          <BackButton />
        </div>
      </div>
    );
  }

  return (
    <div className="product-compare-page">
      <div className="product-compare-container">
        <div className="compare-header">
          <h1>Compare products</h1>
          <BackButton className="compare-back" />
        </div>
        <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
          {products.map((product) => (
            <div key={product.id} className="compare-card">
              <h3 className="compare-card-name">{product.name}</h3>
              <p className="compare-card-brand">{product.brand}</p>
              <p className="compare-card-meta">{product.category} · {product.price}</p>
              <div className="compare-card-rating">
                <IconStar size={18} strokeWidth={2} />
                <span>{product.rating}</span>
              </div>
              <div className="compare-card-section">
                <h4>Ingredients</h4>
                <ul>
                  {product.ingredients.slice(0, 6).map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                  {product.ingredients.length > 6 && <li>+{product.ingredients.length - 6} more</li>}
                </ul>
              </div>
              <div className="compare-card-section">
                <h4>Concerns</h4>
                <div className="compare-tags">
                  {product.concerns.length > 0 ? product.concerns.map((c, i) => (
                    <span key={i} className="compare-tag">{c}</span>
                  )) : <span className="compare-tag empty">—</span>}
                </div>
              </div>
              <Link to={`/product/${product.id}`} className="compare-card-link">View details</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductComparePage;
