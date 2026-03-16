import { useState, useCallback } from 'react';
import { searchService } from '../services/api/searchService';
import { SearchResult, SearchFilters } from '../types/api';
import { debounce } from 'lodash';

export function useSearch() {
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (
    query: string, 
    filters?: SearchFilters, 
    page: number = 1, 
    limit: number = 10
  ) => {
    if (!query.trim()) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchService.search(query, filters, page, limit);
      setData(results);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version of search
  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    [performSearch]
  );

  return {
    data,
    loading,
    error,
    actions: {
      search: performSearch,
      debouncedSearch
    }
  };
}
