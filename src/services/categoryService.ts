import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

import getImageUrl from '../utils/urlConvertor';

export type CategoryImage = {
  url: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
};

export type Category = {
  _id: string;
  title: string;
  image?: CategoryImage;
  serviceId?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GetCategoriesParams = {
  page?: number;
  limit?: number;
  active?: boolean;
  search?: string;
};

export type GetCategoriesResponse = {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getCategoryImageUrl = (url?: string) => {
  return getImageUrl(url)
};

export const useCategoryService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const getCategories = useCallback(
    (params: GetCategoriesParams = {}) => {
      return fetchData<GetCategoriesResponse>({
        url: '/api/categories',
        method: 'GET',
        params,
      });
    },
    [fetchData],
  );

  const searchCategories = useCallback(
    (search: string, params: Omit<GetCategoriesParams, 'search'> = {}) => {
      return getCategories({
        ...params,
        search,
      });
    },
    [getCategories],
  );

  return {
    getCategories,
    searchCategories,
    loading,
    error,
    clearError,
  };
};
