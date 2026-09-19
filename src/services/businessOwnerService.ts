import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';

export type BusinessOwner = {
  _id: string;
  email: string;
  role: 'BUSINESS_OWNER' | string;
  type?: string;
  businessType?: string;
  onboardingStatus?: string;
  isProfileCompleted?: boolean;
  verificationStatus?: string;
};

export type BusinessOwnerAuthResponse = {
  token?: string;
  isNewUser?: boolean;
  owner?: BusinessOwner;
};

export type BusinessAndCuisineType = {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type BusinessAndCuisineTypesResponse = {
  businessTypes: BusinessAndCuisineType[];
  cuisineTypes: BusinessAndCuisineType[];
  counts: {
    businessTypes: number;
    cuisineTypes: number;
    total: number;
  };
};

export type UploadFile = {
  uri: string;
  name?: string;
  type?: string;
};

export type BusinessOwnerAuthPayload = {
  email: string;
  password: string;
  type?: string;
  businessPhoto?: UploadFile | string | null;
  profilePhoto?: UploadFile | string | null;
  businessName?: string;
  cuisineType?: string;
  businessType?: string;
  fullName?: string;
  professionalTitle?: string;
  about?: string;
  languages?: string[];
  address?: string;
  area?: string;
  city?: string;
  pinCode?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type BusinessHourPayload = {
  day: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

export type BusinessDocumentsPayload = {
  tradeLicense?: UploadFile | null;
  fssaiCertificate?: UploadFile | null;
  idProof?: UploadFile | null;
};

export type ServiceProviderOnboardingPayload = {
  workExperiences: {
    jobTitle: string;
    companyName: string;
    startDate: string;
    endDate: string | null;
    currentlyWorking: boolean;
  }[];
  educationCertifications: {
    title: string;
    institution: string;
    startDate: string;
    endDate: string;
    description: string;
    certificateUrl: string;
  }[];
  hourlyRate: number;
  serviceCallCharge: number;
  minimumCharge: number;
  currency: string;
  availabilityPreference: string;
  workingAreas: {
    address: string;
    area: string;
    city: string;
    pinCode: string;
  }[];
};

const getFileName = (uri: string, fallback: string) => {
  const name = uri.split('/').pop();
  return name && name.includes('.') ? name : fallback;
};

const appendUpload = (formData: FormData, key: string, file: UploadFile) => {
  formData.append(key, {
    uri: file.uri,
    name: file.name || getFileName(file.uri, `${key}.jpg`),
    type: file.type || 'image/jpeg',
  } as unknown as Blob);
};

const buildOwnerAuthFormData = (data: BusinessOwnerAuthPayload) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (
      (key === 'businessPhoto' || key === 'profilePhoto') &&
      typeof value === 'object' &&
      'uri' in value
    ) {
      appendUpload(formData, key, value);
      return;
    }

    if (key === 'location' || Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

const buildDocumentsFormData = (data: BusinessDocumentsPayload) => {
  const formData = new FormData();

  if (data.tradeLicense) {
    appendUpload(formData, 'tradeLicense', data.tradeLicense);
  }

  if (data.fssaiCertificate) {
    appendUpload(formData, 'fssaiCertificate', data.fssaiCertificate);
  }

  if (data.idProof) {
    appendUpload(formData, 'idProof', data.idProof);
  }

  return formData;
};

export const isApiSuccess = (success: unknown) =>
  success === true || success === 'true';

export const useBusinessOwnerService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const authenticateOwner = useCallback(
    (data: BusinessOwnerAuthPayload) => {
      const hasUpload =
        (data.businessPhoto &&
          typeof data.businessPhoto === 'object' &&
          'uri' in data.businessPhoto) ||
        (data.profilePhoto &&
          typeof data.profilePhoto === 'object' &&
          'uri' in data.profilePhoto);

      return fetchData<BusinessOwnerAuthResponse>({
        url: '/business-owners/auth',
        method: 'POST',
        data: hasUpload ? buildOwnerAuthFormData(data) : data,
        service: false,
      });
    },
    [fetchData],
  );

  const getBusinessAndCuisineTypes = useCallback(() => {
    return fetchData<BusinessAndCuisineTypesResponse>({
      url: '/admin/business-owners/types',
      method: 'GET',
      service: false,
    });
  }, [fetchData]);

  const updateBusinessHours = useCallback(
    (businessHours: BusinessHourPayload[]) => {
      return fetchData({
        url: '/business-owners/onboarding/business/hours',
        method: 'PATCH',
        data: { businessHours },
        service: false,
      });
    },
    [fetchData],
  );

  const updateBusinessDocuments = useCallback(
    (data: BusinessDocumentsPayload) => {
      return fetchData({
        url: '/business-owners/onboarding/business/documents',
        method: 'PATCH',
        data: buildDocumentsFormData(data),
        service: false,
      });
    },
    [fetchData],
  );

  const updateServiceProviderOnboarding = useCallback(
    (data: ServiceProviderOnboardingPayload) => {
      return fetchData({
        url: '/business-owners/onboarding/service-provider',
        method: 'PATCH',
        data,
        service: false,
      });
    },
    [fetchData],
  );

  return {
    authenticateOwner,
    getBusinessAndCuisineTypes,
    updateBusinessHours,
    updateBusinessDocuments,
    updateServiceProviderOnboarding,
    loading,
    error,
    clearError,
  };
};
