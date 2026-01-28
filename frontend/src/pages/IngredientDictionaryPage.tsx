import React, { useState, useMemo } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useDebounce } from '../hooks/useDebounce';
import './IngredientDictionaryPage.css';

const INGREDIENTS = [
  { name: 'Niacinamide', desc: 'Supports barrier strength, reduces redness, and balances oil.', best: 'sensitivity, redness, oiliness' },
  { name: 'Hyaluronic Acid', desc: 'Humectant that draws moisture to the skin for lasting hydration.', best: 'dehydration, dryness' },
  { name: 'Retinol', desc: 'Encourages cell turnover to improve texture and fine lines.', best: 'texture, wrinkles' },
];

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i} className="ingredient-highlight">{part}</mark> : part));
}

const IngredientDictionaryPage: React.FC = () => {
  usePageTitle('Ingredient Dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return INGREDIENTS;
    return INGREDIENTS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.desc.toLowerCase().includes(q) ||
        i.best.toLowerCase().includes(q)
    );
  }, [debouncedQuery]);

  return (
    <div className="ingredient-page">
      <div className="page-container ingredient-container">
        <div className="page-header">
          <h1>Ingredient Dictionary</h1>
          <p>Search ingredients and learn how they support your skin goals.</p>
        </div>

        <form className="ingredient-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            placeholder="Search ingredients (e.g., niacinamide)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search ingredients"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="ingredient-grid">
          {filtered.map((item) => (
            <div key={item.name} className="ingredient-card">
              <h3>{highlightMatch(item.name, searchQuery)}</h3>
              <p>{highlightMatch(item.desc, searchQuery)}</p>
              <span>Best for: {highlightMatch(item.best, searchQuery)}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
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
