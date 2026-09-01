import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
import type { User, UserProfileDetails } from '../types/auth';

export type SendOtpPayload = {
  countryCode: string;
  phoneNumber: string;
};

export type SendOtpResponse = {
  countryCode: string;
  phoneNumber: string;
  fullPhoneNumber: string;
  status: string;
};

export type VerifyOtpPayload = SendOtpPayload & {
  otp: string;
};

export type AuthUser = {
  id: string;
  userAuthId?: string;
  role: User['role'];
  firstName?: string;
  lastName?: string;
  email?: string;
  countryCode: string;
  phoneNumber: string;
  fullPhoneNumber: string;
  profileImage?: {
    url: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
  profileDetails?: UserProfileDetails;
};

export type VerifyOtpResponse = {
  user: AuthUser;
  token: string;
};

export type GetMeResponse = {
  user: AuthUser;
};

export type ProfileImagePayload = {
  uri: string;
  name?: string;
  type?: string;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email: string;
  profileImage?: ProfileImagePayload;
};

export type UpdateProfileResponse = {
  user: AuthUser;
};

const buildProfileFormData = (data: UpdateProfilePayload) => {
  const formData = new FormData();

  formData.append('firstName', data.firstName);
  formData.append('lastName', data.lastName);
  formData.append('email', data.email);

  if (data.phoneNumber) {
    formData.append('phoneNumber', data.phoneNumber);
  }

  if (data.profileImage) {
    formData.append('profileImage', {
      uri: data.profileImage.uri,
      name: data.profileImage.name || 'profile-image.jpg',
      type: data.profileImage.type || 'image/jpeg',
    } as unknown as Blob);
  }

  return formData;
};

export const useAuthService = () => {
  const { fetchData, loading, error, clearError } = useAxios();

  const sendOtp = useCallback(
    (data: SendOtpPayload) => {
      return fetchData<SendOtpResponse>({
        url: '/api/auth/send-otp',
        method: 'POST',
        data,
      });
    },
    [fetchData],
  );

  const verifyOtp = useCallback(
    (data: VerifyOtpPayload) => {
      return fetchData<VerifyOtpResponse>({
        url: '/api/auth/verify-otp',
        method: 'POST',
        data,
      });
    },
    [fetchData],
  );

  const getMe = useCallback(() => {
    return fetchData<GetMeResponse>({
      url: '/api/auth/me',
      method: 'GET',
    });
  }, [fetchData]);

  const updateProfile = useCallback(
    (data: UpdateProfilePayload) => {
      return fetchData<UpdateProfileResponse>({
        url: '/api/auth/profile',
        method: 'PUT',
        data: buildProfileFormData(data),
      });
    },
    [fetchData],
  );

  return {
    sendOtp,
    verifyOtp,
    getMe,
    updateProfile,
    loading,
    error,
    clearError,
  };
};
