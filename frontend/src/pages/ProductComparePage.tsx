import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { IconStar } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { getProduct as getCatalogProduct } from '../services/catalogService';
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

function catalogToCompare(p: { id: string; name: string; brand: string; category: string; price_usd?: number; ingredients?: string[]; targets_concerns?: string[]; image_url?: string }): CompareProduct {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price_usd != null ? `$${p.price_usd.toFixed(2)}` : '—',
    rating: 4,
    ingredients: p.ingredients ?? [],
    concerns: p.targets_concerns ?? [],
    imageUrl: p.image_url,
  };
}

function getProduct(id: string): CompareProduct {
  return MOCK_PRODUCTS[id] ?? { id, name: `Product ${id}`, brand: '—', category: '—', price: '—', rating: 0, ingredients: [], concerns: [] };
}

const ProductComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4), [idsParam]);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Compare Products', 'Side-by-side product comparison.');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const results: CompareProduct[] = [];
      for (const id of ids) {
        try {
          const catalogProduct = await getCatalogProduct(id);
          if (!cancelled) results.push(catalogToCompare(catalogProduct));
        } catch {
          if (!cancelled) results.push(getProduct(id));
        }
      }
      if (!cancelled) setProducts(results);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [ids]);

  if (ids.length < 2) {
    return (
      <div className="product-compare-page app-page">
        <div className="app-page-content product-compare-container">
          <div className="app-card app-empty-state">
            <h1>Compare products</h1>
            <p>Add at least 2 products from product pages or recommendations to compare side by side.</p>
            <Link to="/recommendations" className="btn btn-primary">Browse recommendations</Link>
          </div>
          <BackButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-compare-page app-page">
        <div className="app-page-content product-compare-container">
          <p className="compare-loading">Loading products…</p>
          <BackButton />
        </div>
      </div>
    );
  }

  return (
    <div className="product-compare-page app-page">
      <header className="app-header-card">
        <h1>Compare products</h1>
        <p className="app-header-subtitle">{products.length} products</p>
      </header>
      <div className="app-page-content product-compare-container">
        <div className="compare-header">
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
