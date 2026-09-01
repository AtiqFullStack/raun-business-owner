import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

import getImageUrl from '../utils/urlConvertor';

export type BannerImage = {
  url: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
};

export type Banner = {
  _id: string;
  title: string;
  image?: BannerImage;
  serviceId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GetBannersParams = {
  search?: string;
};

export type GetBannersResponse = {
  banners: Banner[];
};



export const getBannerImageUrl = (url?: string) => getImageUrl(url);

export const useBannerService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const getBanners = useCallback(
    (params: GetBannersParams = {}) => {
      return fetchData<GetBannersResponse>({
        url: '/api/banners',
        method: 'GET',
        params,
      });
    },
    [fetchData],
  );

  const searchBanners = useCallback(
    (search: string) => {
      return getBanners({
        search,
      });
    },
    [getBanners],
  );

  return {
    getBanners,
    searchBanners,
    loading,
    error,
    clearError,
  };
};
