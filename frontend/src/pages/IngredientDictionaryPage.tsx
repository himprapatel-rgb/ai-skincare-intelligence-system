import React, { useState, useMemo, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useDebounce } from '../hooks/useDebounce';
import { API_BASE_URL } from '../config';
import './IngredientDictionaryPage.css';

type CategoryKey = 'all' | 'hydrating' | 'anti-aging' | 'acne' | 'brightening';

const CATEGORY_FILTERS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hydrating', label: 'Hydrating' },
  { key: 'anti-aging', label: 'Anti-Aging' },
  { key: 'acne', label: 'Acne-Fighting' },
  { key: 'brightening', label: 'Brightening' },
];

interface Ingredient {
  name: string;
  desc: string;
  best: string;
  categories: CategoryKey[];
}

const FALLBACK_INGREDIENTS: Ingredient[] = [
  { name: 'Niacinamide', desc: 'Supports barrier strength, reduces redness, and balances oil.', best: 'sensitivity, redness, oiliness', categories: ['acne', 'brightening'] },
  { name: 'Hyaluronic Acid', desc: 'Humectant that draws moisture to the skin for lasting hydration.', best: 'dehydration, dryness', categories: ['hydrating'] },
  { name: 'Retinol', desc: 'Encourages cell turnover to improve texture and fine lines.', best: 'texture, wrinkles', categories: ['anti-aging'] },
  { name: 'Salicylic Acid', desc: 'BHA that penetrates pores to dissolve excess oil and dead skin.', best: 'acne, blackheads, oily skin', categories: ['acne'] },
  { name: 'Vitamin C', desc: 'Antioxidant that brightens skin and protects against free radicals.', best: 'dark spots, dullness, sun damage', categories: ['brightening', 'anti-aging'] },
  { name: 'Ceramides', desc: 'Lipids that restore and maintain the skin moisture barrier.', best: 'dryness, eczema, barrier repair', categories: ['hydrating'] },
  { name: 'Glycolic Acid', desc: 'AHA that exfoliates surface dead skin cells for smoother texture.', best: 'texture, dullness, fine lines', categories: ['anti-aging', 'brightening'] },
  { name: 'Squalane', desc: 'Lightweight emollient that mimics natural skin oils for hydration.', best: 'dryness, dehydration', categories: ['hydrating'] },
  { name: 'Benzoyl Peroxide', desc: 'Antibacterial agent that kills acne-causing bacteria.', best: 'acne, blemishes', categories: ['acne'] },
  { name: 'Azelaic Acid', desc: 'Gentle acid that reduces redness, pigmentation, and acne.', best: 'rosacea, acne, dark spots', categories: ['acne', 'brightening'] },
  { name: 'Peptides', desc: 'Amino acid chains that signal skin to produce more collagen.', best: 'wrinkles, firmness, aging', categories: ['anti-aging'] },
  { name: 'Zinc Oxide', desc: 'Mineral UV filter that provides broad-spectrum sun protection.', best: 'sun protection, sensitive skin', categories: ['all'] },
  { name: 'Alpha Arbutin', desc: 'Tyrosinase inhibitor that fades dark spots and evens skin tone.', best: 'hyperpigmentation, dark spots', categories: ['brightening'] },
  { name: 'Tea Tree Oil', desc: 'Natural antimicrobial that helps reduce acne and inflammation.', best: 'acne, blemishes', categories: ['acne'] },
  { name: 'Lactic Acid', desc: 'Gentle AHA that exfoliates while hydrating the skin.', best: 'dryness, texture, sensitivity', categories: ['hydrating', 'brightening'] },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i} className="ingredient-highlight">{part}</mark> : part));
}

/** Map backend ingredient data to our format */
function mapApiIngredient(item: Record<string, unknown>): Ingredient {
  const name = String(item.name || item.ingredient_name || '');
  const desc = String(item.description || item.desc || '');
  const benefits = Array.isArray(item.benefits) ? (item.benefits as string[]).join(', ') : String(item.best_for || item.best || '');
  const cats: CategoryKey[] = [];
  const lower = `${name} ${desc} ${benefits}`.toLowerCase();
  if (/hydrat|moisture|dry/i.test(lower)) cats.push('hydrating');
  if (/aging|wrinkle|collagen|peptide|retinol/i.test(lower)) cats.push('anti-aging');
  if (/acne|blemish|breakout|salicylic/i.test(lower)) cats.push('acne');
  if (/bright|dark.spot|pigment|vitamin.c/i.test(lower)) cats.push('brightening');
  return { name, desc, best: benefits, categories: cats.length > 0 ? cats : ['all'] };
}

const IngredientDictionaryPage: React.FC = () => {
  usePageTitle('Ingredient Dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all');
  const [ingredients, setIngredients] = useState<Ingredient[]>(FALLBACK_INGREDIENTS);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch ingredients from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/catalog/ingredients`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.ingredients || data.data || []);
        if (cancelled || items.length === 0) return;
        setIngredients(items.map(mapApiIngredient).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        // Keep fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = ingredients;
    const q = debouncedQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q) ||
          i.best.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.categories.includes(categoryFilter));
    }
    return list;
  }, [debouncedQuery, categoryFilter, ingredients]);

  const firstLetterToId = useMemo(() => {
    const map = new Map<string, string>();
    filtered.forEach((i) => {
      const letter = i.name.charAt(0).toUpperCase();
      if (!map.has(letter)) map.set(letter, `letter-${letter}`);
    });
    return map;
  }, [filtered]);

  return (
    <div className="ingredient-page app-page">
      <header className="app-header-card">
        <h1>Ingredient Dictionary</h1>
        <p className="app-header-subtitle">
          {ingredients.length} ingredients — search by name or skin concern
        </p>
      </header>
      <div className="app-page-content ingredient-container">
        <form className="ingredient-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            placeholder="Search ingredients (e.g., niacinamide, retinol)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search ingredients"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="ingredient-filters">
          {CATEGORY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`filter-btn ${categoryFilter === key ? 'active' : ''}`}
              onClick={() => setCategoryFilter(key)}
              data-filter={key}
            >
              {label}
            </button>
          ))}
        </div>

        <nav className="alphabet-nav" aria-label="Jump to letter">
          {ALPHABET.map((letter) => {
            const id = firstLetterToId.get(letter);
            if (!id) return <span key={letter} className="alphabet-letter disabled">{letter}</span>;
            return (
              <a key={letter} href={`#${id}`} className="alphabet-letter">{letter}</a>
            );
          })}
        </nav>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 80, background: 'var(--bg-tertiary, #eef2f6)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div className="ingredient-grid">
            {filtered.map((item) => {
              const letterId = firstLetterToId.get(item.name.charAt(0).toUpperCase());
              const isFirstForLetter = letterId && filtered.findIndex((i) => i.name.charAt(0).toUpperCase() === item.name.charAt(0).toUpperCase()) === filtered.indexOf(item);
              return (
                <div
                  key={item.name}
                  id={isFirstForLetter ? letterId : undefined}
                  className="ingredient-card"
                >
                  <h3>{highlightMatch(item.name, searchQuery)}</h3>
                  <p>{highlightMatch(item.desc, searchQuery)}</p>
                  <span>Best for: {highlightMatch(item.best, searchQuery)}</span>
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="ingredient-empty" role="status">
            <p className="ingredient-empty-title">Ingredient not found</p>
            <p className="ingredient-empty-text">
              {debouncedQuery.trim()
                ? `No ingredients match "${debouncedQuery}". Check the spelling or try a different search.`
                : 'No ingredients in the dictionary yet. Try searching by name or concern.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientDictionaryPage;
