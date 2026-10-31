import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
import { isApiSuccess } from './businessOwnerService';
import type { MapCoordinates } from '../components/Map';
export type OwnerPlace = {
  placeId: string;
  address: string;
  area: string;
  city: string;
  pinCode: string;
  countryCode: string;
  coordinates: MapCoordinates;
};
export type PlaceSuggestion = { placeId: string; label: string };
export function useOwnerPlacesService() {
  const { fetchData } = useAxios();
  const search = useCallback(
    async (input: string, sessionToken: string, kind: string) => {
      const response = await fetchData<{ suggestions: PlaceSuggestion[] }>({
        url: '/business-owners/places/search',
        method: 'POST',
        data: { input, sessionToken, kind },
        service: false,
      });
      if (!isApiSuccess(response.success))
        throw new Error(response.message || 'Unable to search addresses.');
      return response.data.suggestions;
    },
    [fetchData],
  );
  const details = useCallback(
    async (placeId: string, sessionToken: string) => {
      const response = await fetchData<OwnerPlace>({
        url: '/business-owners/places/details',
        method: 'POST',
        data: { placeId, sessionToken },
        service: false,
      });
      if (!isApiSuccess(response.success))
        throw new Error(response.message || 'Unable to select address.');
      return response.data;
    },
    [fetchData],
  );
  return { search, details };
}
