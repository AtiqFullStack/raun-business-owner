import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

import getImageUrl from '../utils/urlConvertor';



export interface RestaurantImage {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface Restaurant {
  _id: string;
  ownerId: string;
  name: string;
  openingTime: string;
  closingTime: string;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: string;
  updatedAt: string;
  images?: RestaurantImage[];
}
export type GetRestaurantsParams = {
  search?: string;
  page?: number;
  limit?: number;
};
export type GetRestaurantsResponse = {
  restaurants: Restaurant[];
};

export interface MenuImage {
  url: string;
  isPrimary: boolean;
  _id: string;
}

export interface MenuVariant {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ApiMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  categoryId: string;
  description: string;
  basePrice: number;
  images: MenuImage[];
  variants: MenuVariant[];
  addonGroups: any[];
  isVeg: boolean;
  isAvailable: boolean;
  stock: number;
  discount?: { type: string; value: number };
  availableTime?: { start: string; end: string };
  createdAt: string;
  updatedAt: string;
}

export type GetRestaurantByIdResponse = {
  restaurant: Restaurant;
  menus: ApiMenuItem[];
};

export type GetRestaurantByIdParams = {
  search?: string;
};

const getAssetUrl = (url?: string) => {
  return getImageUrl(url)
};

export const getBannerImageUrl = (url?: string) => getAssetUrl(url);

export const useRestaurantServices = () => {
  const { fetchData, loading, error, clearError } = useAxios();

 const getRestaurantById = useCallback(
    (id: string, params?: GetRestaurantByIdParams) =>
      fetchData<GetRestaurantByIdResponse>({
        url: `/api/restaurants/${id}`,
        method: 'GET',
        params,
      }),
    [fetchData],
  );

  const getRestaurants = useCallback(
  (params: GetRestaurantsParams = {}) => {
    return fetchData<GetRestaurantsResponse>({
      url: '/api/restaurants',
      method: 'GET',
      params, // yaha page, limit, search sab jayega
    });
  },
  [fetchData],
);

const searchRestaurants = useCallback(
  (search: string, page = 1, limit = 10) => {
    return getRestaurants({
      search,
      page,
      limit,
    });
  },
  [getRestaurants],
);
  return {
    searchRestaurants,
    getRestaurants,
    getRestaurantById,
    loading,
    error,
    clearError,
  };
};
