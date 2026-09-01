import { create } from 'zustand';
import type { UserAddress } from '../services/addressService';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  coords: LocationCoords | null;
  error: string | null;
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  loading: boolean;
  physicalLocation: string;
  setAddresses: (addresses: UserAddress[]) => void;
  setSelectedAddress: (address: UserAddress | null) => void;
  setCoords: (coords: LocationCoords | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setPhysicalLocation: (physicalLocation: string) => void;
};

export const useLocationStore = create<LocationState>(set => ({
  addresses: [],
  coords: null,
  error: null,
  loading: false,
  physicalLocation: '',
  selectedAddress: null,
  setAddresses: addresses => {
    const selectedAddress =
      addresses.find(address => address.isDefault) ?? addresses[0] ?? null;

    set({
      addresses,
      selectedAddress,
      physicalLocation: selectedAddress?.formattedAddress ?? '',
    });
  },
  setCoords: coords => set({ coords }),
  setError: error => set({ error }),
  setLoading: loading => set({ loading }),
  setPhysicalLocation: physicalLocation => set({ physicalLocation }),
  setSelectedAddress: selectedAddress =>
    set({
      selectedAddress,
      physicalLocation: selectedAddress?.formattedAddress ?? '',
    }),
}));
