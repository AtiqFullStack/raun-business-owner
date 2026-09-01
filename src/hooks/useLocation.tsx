import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  useLocationStore,
  type LocationCoords,
} from '../store/useLocationStore';

type NominatimAddress = {
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
  display_name?: string;
};

const getAndroidLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'Raun needs your location to find your current address.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const getLocation = async (): Promise<LocationCoords> => {
  const hasPermission = await getAndroidLocationPermission();

  if (!hasPermission) {
    throw new Error('Location permission denied');
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};

const getReadableLocation = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    {
      headers: {
        'User-Agent': 'raun-mobile-app',
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch readable location');
  }

  const data = (await response.json()) as NominatimResponse;
  const address = data.address || {};
  const city = address.city || address.town || address.village;
  const shortAddress = [address.road, city, address.state, address.country]
    .filter(Boolean)
    .join(', ');

  return shortAddress || data.display_name || '';
};

export default function useLocation() {
  const coords = useLocationStore(state => state.coords);
  const error = useLocationStore(state => state.error);
  const loading = useLocationStore(state => state.loading);
  const physicalLocation = useLocationStore(state => state.physicalLocation);
  const setCoords = useLocationStore(state => state.setCoords);
  const setError = useLocationStore(state => state.setError);
  const setLoading = useLocationStore(state => state.setLoading);
  const setPhysicalLocation = useLocationStore(
    state => state.setPhysicalLocation,
  );

  const getPhysicalLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await getLocation();
      console.log(location)
      const readableLocation = await getReadableLocation(
        location.latitude,
        location.longitude,
      );

      setCoords(location);
      setPhysicalLocation(readableLocation);
      return readableLocation;
    } catch (locationError) {
      const message =
        locationError instanceof Error
          ? locationError.message
          : 'Unable to get current location';

      setError(message);
      return '';
    } finally {
      setLoading(false);
    }
  }, [setCoords, setError, setLoading, setPhysicalLocation]);

  return {
    coords,
    error,
    getPhysicalLocations,
    loading,
    physicalLocation,
    setPhysicalLocation,
  };
}
