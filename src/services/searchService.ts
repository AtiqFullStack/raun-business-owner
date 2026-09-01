import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
import type { Restaurant } from './resturantServices';
import type { Category } from './categoryService';

export interface SearchResults {
  query: string;
  restaurants: Restaurant[];
  menuItems: SearchMenuItem[];
  categories: Category[];
  locations: SearchLocation[];
}

export interface SearchMenuItem {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  images: { url: string; isPrimary: boolean }[];
  restaurantId: { _id: string; name: string };
  categoryId: string;
}

export interface SearchLocation {
  _id: string;
  city: string;
  area: string;
  state: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export interface RestaurantWithCategory extends Restaurant {
  category: Category;
}

export interface ByCategoryResponse {
  category: Category;
  restaurants: RestaurantWithCategory[];
  total: number;
}

export const useSearchService = () => {
  const { fetchData, loading, error } = useAxios();

  const globalSearch = useCallback(
    (q: string) =>
      fetchData<SearchResults>({
        url: '/api/search',
        method: 'GET',
        params: { q },
      }),
    [fetchData],
  );

  const searchByCategory = useCallback(
    (params: { categoryId?: string; categoryTitle?: string }) =>
      fetchData<ByCategoryResponse>({
        url: '/api/search/by-category',
        method: 'GET',
        params,
      }),
    [fetchData],
  );

  return { globalSearch, searchByCategory, loading, error };
};
