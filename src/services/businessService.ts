import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessImage {
  cover: string;
  gallery: string[];
  thumbnail: string;
}

export interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Business {
  _id: string;
  name: string;
  category: string;
  isFeatured: boolean;
  isActive: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: {
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    fullAddress?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  description: {
    short?: string;
    full?: string;
  };
  pricing: {
    priceRange?: string;
    averagePrice?: number;
  };
  amenities: string[];
  businessHours: BusinessHour[];
  images: BusinessImage;
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetBusinessesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface GetBusinessesResponse {
  businesses: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetBusinessByIdResponse {
  business: Business;
}

export interface NearbyParams {
  lat: number;
  lng: number;
  radius?: number; // meters, default 5000
}

export interface NearbyResponse {
  businesses: Business[];
  total: number;
}

// ─── Create Payload (FormData) ────────────────────────────────────────────────

export interface CreateBusinessPayload {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  isFeatured?: boolean;
  isActive?: boolean;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  shortDescription?: string;
  fullDescription?: string;
  priceRange?: string;
  averagePrice?: number;
  amenities?: string[]; // will be joined as comma-separated
  businessHours?: BusinessHour[]; // will be JSON.stringify'd
  images?: { uri: string; name: string; type: string }[];
}

const buildFormData = (payload: CreateBusinessPayload): FormData => {
  const fd = new FormData() as any;

  fd.append('name', payload.name);
  fd.append('category', payload.category);
  fd.append('latitude', String(payload.latitude));
  fd.append('longitude', String(payload.longitude));

  if (payload.isFeatured !== undefined) fd.append('isFeatured', String(payload.isFeatured));
  if (payload.isActive !== undefined) fd.append('isActive', String(payload.isActive));

  const optionalStr: (keyof CreateBusinessPayload)[] = [
    'street', 'area', 'city', 'district', 'fullAddress',
    'phone', 'email', 'website',
    'facebook', 'instagram', 'twitter',
    'shortDescription', 'fullDescription',
    'priceRange',
  ];
  optionalStr.forEach((key) => {
    if (payload[key] !== undefined) fd.append(key, String(payload[key]));
  });

  if (payload.averagePrice !== undefined) fd.append('averagePrice', String(payload.averagePrice));
  if (payload.amenities?.length) fd.append('amenities', payload.amenities.join(','));
  if (payload.businessHours?.length) fd.append('businessHours', JSON.stringify(payload.businessHours));

  payload.images?.forEach((img) => fd.append('images', img));

  return fd;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useBusinessService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  // POST /api/businesses
  const createBusiness = useCallback(
    (payload: CreateBusinessPayload) =>
      fetchData<GetBusinessByIdResponse>({
        url: '/api/businesses',
        method: 'POST',
        data: buildFormData(payload),
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    [fetchData],
  );

  // GET /api/businesses
  const getBusinesses = useCallback(
    (params: GetBusinessesParams = {}) =>
      fetchData<GetBusinessesResponse>({
        url: '/api/businesses',
        method: 'GET',
        params,
      }),
    [fetchData],
  );

  // GET /api/businesses/:id
  const getBusinessById = useCallback(
    (id: string) =>
      fetchData<GetBusinessByIdResponse>({
        url: `/api/businesses/${id}`,
        method: 'GET',
      }),
    [fetchData],
  );

  // PUT /api/businesses/:id
  const updateBusiness = useCallback(
    (id: string, payload: Partial<CreateBusinessPayload>) =>
      fetchData<GetBusinessByIdResponse>({
        url: `/api/businesses/${id}`,
        method: 'PUT',
        data: buildFormData(payload as CreateBusinessPayload),
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    [fetchData],
  );

  // DELETE /api/businesses/:id
  const deleteBusiness = useCallback(
    (id: string) =>
      fetchData<{ business: Business }>({
        url: `/api/businesses/${id}`,
        method: 'DELETE',
      }),
    [fetchData],
  );

  // DELETE /api/businesses/:id/images  — body: { imageUrl }
  const removeBusinessImage = useCallback(
    (id: string, imageUrl: string) =>
      fetchData<GetBusinessByIdResponse>({
        url: `/api/businesses/${id}/images`,
        method: 'DELETE',
        data: { imageUrl },
      }),
    [fetchData],
  );

  // GET /api/businesses/nearby?lat=&lng=&radius=
  const getNearbyBusinesses = useCallback(
    (params: NearbyParams) =>
      fetchData<NearbyResponse>({
        url: '/api/businesses/nearby',
        method: 'GET',
        params,
      }),
    [fetchData],
  );

  return {
    createBusiness,
    getBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness,
    removeBusinessImage,
    getNearbyBusinesses,
    loading,
    error,
    clearError,
  };
};
