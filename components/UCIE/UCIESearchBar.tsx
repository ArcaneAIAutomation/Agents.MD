import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';

interface TokenSuggestion {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
}

interface UCIESearchBarProps {
  onTokenSelect: (symbol: string) => void;
  recentSearches?: string[];
  popularTokens?: string[];
  className?: string;
}

export default function UCIESearchBar({
  onTokenSelect,
  recentSearches = [],
  popularTokens = ['BTC', 'ETH'], // ✅ RESTRICTED: Only BTC & ETH for perfection
  className = ''
}: UCIESearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TokenSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(query.length === 0);
      return;
    }

    setLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ucie/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include' // Required for authentication cookie
        });
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err) {
        setError('Search failed. Please try again.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const itemCount = query.length < 2 
      ? (recentSearches.length + popularTokens.length)
      : suggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (query.length < 2) {
            const allItems = [...recentSearches, ...popularTokens];
            handleSelect(allItems[selectedIndex]);
          } else if (suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex].symbol);
          }
        } else if (query.length >= 2) {
          handleSelect(query.toUpperCase());
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (symbol: string) => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    onTokenSelect(symbol.toUpperCase());
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setError(null);
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-bitcoin-orange" strokeWidth={2.5} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Bitcoin (BTC) or Ethereum (ETH)"
          className="w-full bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange rounded-lg pl-12 pr-12 py-3 md:py-4 text-base md:text-lg font-medium placeholder-bitcoin-white-60 focus:outline-none focus:border-bitcoin-orange focus:shadow-[0_0_20px_rgba(247,147,26,0.3)] transition-all min-h-[48px]"
          aria-label="Search cryptocurrency"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showDropdown}
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-bitcoin-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-bitcoin-orange text-sm px-4">
          {error}
        </div>
      )}

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg shadow-[0_0_30px_rgba(247,147,26,0.3)] max-h-[400px] overflow-y-auto z-50"
          role="listbox"
        >
          {query.length < 2 ? (
            // Show recent searches and popular tokens
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-bitcoin-white-60 text-xs uppercase tracking-wider font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Recent Searches</span>
                  </div>
                  {recentSearches.map((symbol, index) => (
                    <button
                      key={`recent-${symbol}`}
                      onClick={() => handleSelect(symbol)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${
                        selectedIndex === index
                          ? 'bg-bitcoin-orange text-bitcoin-black'
                          : 'text-bitcoin-white hover:bg-bitcoin-orange-10'
                      }`}
                      role="option"
                      aria-selected={selectedIndex === index}
                    >
                      <span className="font-mono font-bold text-lg">{symbol}</span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 px-3 py-2 text-bitcoin-white-60 text-xs uppercase tracking-wider font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Popular Tokens</span>
                </div>
                {popularTokens.map((symbol, index) => {
                  const adjustedIndex = recentSearches.length + index;
                  return (
                    <button
                      key={`popular-${symbol}`}
                      onClick={() => handleSelect(symbol)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${
                        selectedIndex === adjustedIndex
                          ? 'bg-bitcoin-orange text-bitcoin-black'
                          : 'text-bitcoin-white hover:bg-bitcoin-orange-10'
                      }`}
                      role="option"
                      aria-selected={selectedIndex === adjustedIndex}
                    >
                      <span className="font-mono font-bold text-lg">{symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            // Show search results
            <div className="p-2">
              {suggestions.map((token, index) => (
                <button
                  key={token.id}
                  onClick={() => handleSelect(token.symbol)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${
                    selectedIndex === index
                      ? 'bg-bitcoin-orange text-bitcoin-black'
                      : 'text-bitcoin-white hover:bg-bitcoin-orange-10'
                  }`}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-lg truncate">
                        {token.symbol.toUpperCase()}
                      </div>
                      <div className="text-sm text-bitcoin-white-60 truncate">
                        {token.name}
                      </div>
                    </div>
                    {token.market_cap_rank && (
                      <div className="flex-shrink-0 text-xs text-bitcoin-white-60 font-semibold">
                        #{token.market_cap_rank}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-bitcoin-white-60">
              <div className="inline-block w-8 h-8 border-2 border-bitcoin-orange border-t-transparent rounded-full animate-spin mb-2"></div>
              <div>Searching...</div>
            </div>
          ) : (
            <div className="p-8 text-center text-bitcoin-white-60">
              No tokens found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
