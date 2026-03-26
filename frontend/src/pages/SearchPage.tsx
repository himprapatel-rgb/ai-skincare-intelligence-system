import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconX, IconPackage, IconDroplet, IconFileText, IconTrendingUp } from '../components/Icons';
import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { usePageTitle } from '../hooks/usePageTitle';
import styles from './SearchPage.module.css';

type SearchTab = 'all' | 'products' | 'ingredients' | 'blog';

interface SearchResult {
  id: string;
  type: 'product' | 'ingredient' | 'blog';
  title: string;
  subtitle: string;
  url?: string;
}

interface Suggestion {
  text: string;
  type?: string;
}

const TAB_CONFIG: { key: SearchTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'products', label: 'Products' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'blog', label: 'Blog' },
];

const SUGGESTION_PROMPTS = [
  'niacinamide',
  'retinol',
  'vitamin C serum',
  'moisturizer for dry skin',
  'salicylic acid',
];

function getResultIcon(type: string) {
  switch (type) {
    case 'product':
      return <IconPackage size={22} strokeWidth={2} />;
    case 'ingredient':
      return <IconDroplet size={22} strokeWidth={2} />;
    case 'blog':
      return <IconFileText size={22} strokeWidth={2} />;
    default:
      return <IconSearch size={22} strokeWidth={2} />;
  }
}

function getResultLink(result: SearchResult): string {
  if (result.url) return result.url;
  switch (result.type) {
    case 'product':
      return `/product/${result.id}`;
    case 'ingredient':
      return `/ingredients?q=${encodeURIComponent(result.title)}`;
    case 'blog':
      return `/blog?article=${result.id}`;
    default:
      return '#';
  }
}

/**
 * Search Page
 * Full-text search across products, ingredients, and blog content.
 * Debounced typeahead with suggestion dropdown.
 */
const SearchPage: React.FC = () => {
  usePageTitle('Search');

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showTypeahead, setShowTypeahead] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeaheadRef = useRef<HTMLDivElement>(null);

  // Close typeahead on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target as Node)) {
        setShowTypeahead(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/search/suggestions', {
          params: { q: debouncedQuery.trim() },
        });
        if (!cancelled) {
          const data = res.data;
          setSuggestions(
            Array.isArray(data?.suggestions)
              ? data.suggestions.map((s: string | Suggestion) =>
                  typeof s === 'string' ? { text: s } : s
                )
              : []
          );
          setShowTypeahead(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Perform search
  const doSearch = useCallback(
    async (searchQuery: string, tab: SearchTab) => {
      const q = searchQuery.trim();
      if (!q) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      setShowTypeahead(false);

      try {
        const res = await api.get('/search', {
          params: { q, type: tab },
        });
        const data = res.data;
        setResults(
          Array.isArray(data?.results)
            ? data.results.map(
                (r: Record<string, unknown>) =>
                  ({
                    id: String(r.id ?? ''),
                    type: (r.type as SearchResult['type']) ?? 'product',
                    title: String(r.title ?? r.name ?? ''),
                    subtitle: String(r.subtitle ?? r.description ?? r.brand ?? ''),
                    url: r.url ? String(r.url) : undefined,
                  }) as SearchResult
              )
            : []
        );
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger search when debounced query or tab changes
  useEffect(() => {
    doSearch(debouncedQuery, activeTab);
  }, [debouncedQuery, activeTab, doSearch]);

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    setShowTypeahead(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.page}>
      {/* Search Bar */}
      <div className={styles.searchBarWrapper} ref={typeaheadRef}>
        <div className={styles.searchInputContainer}>
          <span className={styles.searchIcon}>
            <IconSearch size={20} strokeWidth={2} />
          </span>
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowTypeahead(true);
            }}
            placeholder="Search products, ingredients, articles..."
            aria-label="Search"
            autoComplete="off"
          />
          {query.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <IconX size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Typeahead dropdown */}
        {showTypeahead && suggestions.length > 0 && (
          <div className={styles.typeahead} role="listbox">
            {suggestions.map((s, i) => (
              <div
                key={`${s.text}-${i}`}
                className={styles.suggestionItem}
                role="option"
                aria-selected={false}
                onClick={() => handleSuggestionClick(s.text)}
              >
                <span className={styles.suggestionIcon}>
                  <IconSearch size={16} strokeWidth={2} />
                </span>
                {s.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              className={activeTab === t.key ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            Searching...
          </div>
        )}

        {/* Empty state - no query entered */}
        {!isLoading && !hasSearched && !query.trim() && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <IconSearch size={48} strokeWidth={1.5} />
            </div>
            <h2 className={styles.emptyTitle}>Discover skincare knowledge</h2>
            <p className={styles.emptyText}>
              Search for products, ingredients, or skincare topics.
            </p>
          </div>
        )}

        {/* No results */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className={styles.noResultsState}>
            <h3 className={styles.noResultsTitle}>
              No results for &ldquo;{query.trim()}&rdquo;
            </h3>
            <p className={styles.noResultsText}>
              Try different keywords or browse these popular topics:
            </p>
            <div className={styles.suggestions}>
              {SUGGESTION_PROMPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => setQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className={styles.resultsList}>
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                to={getResultLink(result)}
                className={styles.resultCard}
              >
                <div className={styles.resultIcon}>{getResultIcon(result.type)}</div>
                <div className={styles.resultBody}>
                  <h3 className={styles.resultTitle}>{result.title}</h3>
                  <p className={styles.resultSubtitle}>{result.subtitle}</p>
                </div>
                <span className={styles.resultBadge}>{result.type}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
