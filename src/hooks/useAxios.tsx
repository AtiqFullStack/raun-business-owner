import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useServiceStore } from '../store/useService';
import { API_BASE_URL } from '../var/config';

type ApiResponse<T = any> = {
  success?: boolean;
  data: T;
  message?: string;
  [key: string]: any;
};

export type ApiError = {
  message: string;
  status?: number;
  data?: unknown;
};

type FetchDataConfig<T = any> = {
  url: string;
  method?: Method;
  params?: Record<string, any>;
  data?: unknown;
  headers?: AxiosRequestConfig['headers'];
  service?: boolean;
  responseType?: AxiosRequestConfig['responseType'];
  onSuccess?: (data: T, response: ApiResponse<T>) => void;
};

const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const responseData = axiosError.response?.data;

    return {
      message:
        responseData?.message || axiosError.message || 'Something went wrong.',
      status: axiosError.response?.status,
      data: responseData,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Something went wrong.' };
};

const useAxios = () => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);
  const token = useAuth(state => state.token);

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
      }),
    [],
  );

  const fetchData = useCallback(
    async <T = any,>({
      url,
      method = 'GET',
      params,
      data,
      headers,
      service = true,
      responseType,
      onSuccess,
    }: FetchDataConfig<T>): Promise<ApiResponse<T>> => {
      try {
        setPendingRequests(count => count + 1);
        setError(null);

        const requestHeaders: Record<string, string> = {
          ...(headers as Record<string, string> | undefined),
          Accept: 'application/json',
        };

        const normalizedMethod = method.toUpperCase();

        const isFormData =
          typeof FormData !== 'undefined' && data instanceof FormData;

        if (
          !isFormData &&
          !['GET', 'HEAD'].includes(normalizedMethod) &&
          !requestHeaders['Content-Type'] &&
          !requestHeaders['content-type']
        ) {
          requestHeaders['Content-Type'] = 'application/json';
        }

        if (token) {
          requestHeaders.Authorization = `Bearer ${token.trim()}`;
        }

        const selectedServiceId = useServiceStore.getState().selectedServiceId;

        if (
          service &&
          selectedServiceId &&
          !requestHeaders['service-id'] &&
          !requestHeaders.serviceId
        ) {
          requestHeaders['service-id'] = selectedServiceId;
        }

        const config: AxiosRequestConfig = {
          url,
          method: normalizedMethod,
          headers: requestHeaders,
          responseType,
        };

        if (params && Object.keys(params).length > 0) {
          config.params = params;
        }

        // Never send a request body with GET or HEAD.
        if (!['GET', 'HEAD'].includes(normalizedMethod) && data !== undefined) {
          config.data = data;
        }

        console.log('FINAL AXIOS CONFIG:', {
          method: config.method,
          baseURL: axiosInstance.defaults.baseURL,
          url: config.url,
          params: config.params,
          hasData: config.data !== undefined,
          headers: {
            ...config.headers,
            Authorization: token ? 'Bearer [REDACTED]' : undefined,
          },
        });

        const response = await axiosInstance.request<ApiResponse<T>>(config);

        const apiResponse = response.data;

        if (onSuccess && apiResponse?.success !== false) {
          onSuccess(apiResponse.data, apiResponse);
        }

        return apiResponse;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error('AXIOS NETWORK DEBUG:', {
            message: err.message,
            code: err.code,
            baseURL: err.config?.baseURL,
            url: err.config?.url,
            method: err.config?.method,
            status: err.response?.status,
            responseData: err.response?.data,
            hasRequest: Boolean(err.request),
            hasResponse: Boolean(err.response),
          });
        }

        const apiError = normalizeApiError(err);
        setError(apiError);
        throw apiError;
      } finally {
        setPendingRequests(count => Math.max(0, count - 1));
      }
    },
    [axiosInstance, token],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fetchData,
    loading: pendingRequests > 0,
    error,
    clearError,
  };
};

export default useAxios;
