import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

export type AddressType = 'home' | 'work' | 'other' | 'current';

export type UserAddress = {
  _id: string;
  userAuthId: string;
  label: string;
  addressType: AddressType;
  contactName?: string;
  phoneNumber?: string;
  houseFlatBlock?: string;
  apartmentBuilding?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AddressPayload = {
  label?: string;
  addressType?: AddressType;
  contactName?: string;
  phoneNumber?: string;
  houseFlatBlock?: string;
  apartmentBuilding?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
};

export type AddressResponse = {
  address: UserAddress;
};

export type AddressesResponse = {
  addresses: UserAddress[];
};

export const useAddressService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const getAddresses = useCallback(() => {
    return fetchData<AddressesResponse>({
      url: '/api/user/addresses',
      method: 'GET',
      service: false,
    });
  }, [fetchData]);

  const createAddress = useCallback(
    (data: AddressPayload) => {
      return fetchData<AddressResponse>({
        url: '/api/user/addresses',
        method: 'POST',
        data,
        service: false,
      });
    },
    [fetchData],
  );

  const saveCurrentLocation = useCallback(
    (data: AddressPayload) => {
      return fetchData<AddressResponse>({
        url: '/api/user/addresses/current',
        method: 'POST',
        data,
        service: false,
      });
    },
    [fetchData],
  );

  const updateAddress = useCallback(
    (addressId: string, data: AddressPayload) => {
      return fetchData<AddressResponse>({
        url: `/api/user/addresses/${addressId}`,
        method: 'PATCH',
        data,
        service: false,
      });
    },
    [fetchData],
  );

  const setDefaultAddress = useCallback(
    (addressId: string) => {
      return fetchData<AddressResponse>({
        url: `/api/user/addresses/${addressId}/default`,
        method: 'PATCH',
        service: false,
      });
    },
    [fetchData],
  );

  const deleteAddress = useCallback(
    (addressId: string) => {
      return fetchData<AddressResponse>({
        url: `/api/user/addresses/${addressId}`,
        method: 'DELETE',
        service: false,
      });
    },
    [fetchData],
  );

  return {
    clearError,
    createAddress,
    deleteAddress,
    error,
    getAddresses,
    loading,
    saveCurrentLocation,
    setDefaultAddress,
    updateAddress,
  };
};
