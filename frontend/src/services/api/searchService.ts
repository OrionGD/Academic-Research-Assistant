import apiClient from './client';
import { SearchResult, SearchFilters } from '../../types/api';

/**
 * Search API Service
 */
export const searchService = {
  search: async (
    query: string, 
    filters?: SearchFilters, 
    page: number = 1, 
    limit: number = 10
  ): Promise<SearchResult[]> => {
    const response = await apiClient.post<SearchResult[]>('/search', { 
      query,
      filters,
      page,
      limit
    });
    return response.data;
  }
};
