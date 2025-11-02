import { useState, useEffect } from 'react';
import { RecentSearches, POPULAR_TOKENS } from '../lib/ucie/tokenValidation';

interface UseTokenSearchReturn {
  recentSearches: string[];
  popularTokens: string[];
  addRecentSearch: (symbol: string) => void;
  clearRecentSearches: () => void;
}

/**
 * Custom hook for managing token search state
 * Handles recent searches (localStorage) and popular tokens
 */
export function useTokenSearch(): UseTokenSearchReturn {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTokens] = useState<string[]>(POPULAR_TOKENS);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(RecentSearches.get());
  }, []);

  // Add a recent search
  const addRecentSearch = (symbol: string) => {
    RecentSearches.add(symbol);
    setRecentSearches(RecentSearches.get());
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    RecentSearches.clear();
    setRecentSearches([]);
  };

  return {
    recentSearches,
    popularTokens,
    addRecentSearch,
    clearRecentSearches
  };
}
