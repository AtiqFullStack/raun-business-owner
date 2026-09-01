import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

import getImageUrl from '../utils/urlConvertor';

export type ServiceImage = {
  url: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
};

export type Service = {
  _id: string;
  name: string;
  image?: ServiceImage;
  createdAt?: string;
  updatedAt?: string;
};

export type GetServicesParams = {
  search?: string;
};

export type GetServicesResponse = {
  services: Service[];
};

export const getServiceImageUrl = (url?: string) => {

  return  getImageUrl(url)
};

export const useServiceService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const getServices = useCallback(
    (params: GetServicesParams = {}) => {
      return fetchData<GetServicesResponse>({
        url: '/api/admin/services',
        method: 'GET',
        params,
      });
    },
    [fetchData],
  );

  return {
    getServices,
    loading,
    error,
    clearError,
  };
};
