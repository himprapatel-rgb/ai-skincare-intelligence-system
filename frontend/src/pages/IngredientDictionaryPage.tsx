import React, { useState, useMemo } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useDebounce } from '../hooks/useDebounce';
import './IngredientDictionaryPage.css';

type CategoryKey = 'all' | 'hydrating' | 'anti-aging' | 'acne' | 'brightening';

const CATEGORY_FILTERS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hydrating', label: '💧 Hydrating' },
  { key: 'anti-aging', label: '✨ Anti-Aging' },
  { key: 'acne', label: '🎯 Acne-Fighting' },
  { key: 'brightening', label: '☀️ Brightening' },
];

const INGREDIENTS: Array<{ name: string; desc: string; best: string; categories: CategoryKey[] }> = [
  { name: 'Niacinamide', desc: 'Supports barrier strength, reduces redness, and balances oil.', best: 'sensitivity, redness, oiliness', categories: ['acne', 'brightening'] },
  { name: 'Hyaluronic Acid', desc: 'Humectant that draws moisture to the skin for lasting hydration.', best: 'dehydration, dryness', categories: ['hydrating'] },
  { name: 'Retinol', desc: 'Encourages cell turnover to improve texture and fine lines.', best: 'texture, wrinkles', categories: ['anti-aging'] },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const filtered = useMemo(() => {
    let list = INGREDIENTS;
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
  }, [debouncedQuery, categoryFilter]);

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
        <p className="app-header-subtitle">Search ingredients and see how they support your skin goals.</p>
      </header>
      <div className="app-page-content ingredient-container">
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
