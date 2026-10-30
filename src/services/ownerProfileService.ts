import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
import {
  isApiSuccess,
  type UploadFile,
  type TotalExperienceRange,
} from './businessOwnerService';

export type OwnerProfile = {
  _id: string;
  type: string;
  fullName: string;
  email: string;
  profilePhoto?: string;
  professionalTitle?: string;
  about?: string;
  languages?: string[];
  verificationStatus: string;
  rejectionReason?: string;
  serviceType?: {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
  } | null;
  hourlyRate: number | null;
  serviceCallCharge: number | null;
  minimumCharge: number | null;
  currency: string;
  availabilityPreference: string | null;
  totalExperience?: number | null;
  totalExperienceRange?: TotalExperienceRange | null;
  workingAreas?: {
    address?: string;
    area: string;
    city: string;
    pinCode?: string;
  }[];
  workExperiences?: {
    jobTitle: string;
    companyName: string;
    startDate: string;
    endDate?: string | null;
    currentlyWorking: boolean;
  }[];
  educationCertifications?: {
    title: string;
    institution: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
};
export type OwnerProfileUpdate = Pick<
  OwnerProfile,
  | 'fullName'
  | 'professionalTitle'
  | 'about'
  | 'languages'
  | 'hourlyRate'
  | 'serviceCallCharge'
  | 'minimumCharge'
  | 'availabilityPreference'
> & { profilePhoto?: UploadFile };
export const availabilityLabels: Record<string, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  FLEXIBLE: 'Flexible',
  WEEKENDS: 'Weekends',
};
export const experienceLabels: Record<string, string> = {
  lt1: 'Less than 1 year',
  '1-2': '1–2 years',
  '2-5': '2–5 years',
  '5-10': '5–10 years',
  '10+': '10+ years',
};

export function useOwnerProfileService() {
  const { fetchData } = useAxios();
  const getProfile = useCallback(async () => {
    const response = await fetchData<OwnerProfile>({
      url: '/business-owners/me',
      service: false,
    });
    if (!isApiSuccess(response.success) || !response.data?._id)
      throw new Error(response.message || 'Unable to load your profile.');
    return response.data;
  }, [fetchData]);
  const updateProfile = useCallback(
    async (payload: OwnerProfileUpdate) => {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (
          key === 'profilePhoto' &&
          typeof value === 'object' &&
          'uri' in value
        ) {
          form.append(key, {
            uri: value.uri,
            name: value.name || 'profile.jpg',
            type: value.type || 'image/jpeg',
          } as unknown as Blob);
        } else
          form.append(
            key,
            Array.isArray(value) ? JSON.stringify(value) : String(value),
          );
      });
      const response = await fetchData<OwnerProfile>({
        url: '/business-owners/me',
        method: 'PATCH',
        data: form,
        service: false,
      });
      if (!isApiSuccess(response.success) || !response.data?._id)
        throw new Error(response.message || 'Unable to save your profile.');
      return response.data;
    },
    [fetchData],
  );
  return { getProfile, updateProfile };
}
