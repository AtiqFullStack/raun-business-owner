jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('../src/navigation', () => ({ RootStack: () => null }));
jest.mock('../src/navigation/navigationRef', () => ({ navigationRef: {} }));
jest.mock('../src/components/Toaster', () => () => null);
jest.mock('../src/hooks/useLocation', () => ({
  __esModule: true,
  default: () => ({ getPhysicalLocations: mockGetPhysicalLocations }),
}));
jest.mock('../src/services/addressService', () => ({
  useAddressService: () => ({ getAddresses: mockGetAddresses }),
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return { useAuth: create(() => ({ hasHydrated: false, token: null })) };
});
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useAuth } from '../src/store/useAuth';
const mockGetPhysicalLocations = jest.fn().mockResolvedValue('Current area');
const mockGetAddresses = jest.fn();
let tree: ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({ hasHydrated: false, token: null });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('initializes location after hydration without calling customer address APIs when an owner logs in', async () => {
  await act(async () => {
    tree = create(<App />);
  });
  expect(mockGetPhysicalLocations).not.toHaveBeenCalled();
  await act(async () => {
    useAuth.setState({ hasHydrated: true });
  });
  expect(mockGetPhysicalLocations).toHaveBeenCalledTimes(1);
  await act(async () => {
    useAuth.setState({ token: 'business-owner-token' });
  });
  expect(mockGetAddresses).not.toHaveBeenCalled();
  expect(mockGetPhysicalLocations).toHaveBeenCalledTimes(1);
});
test('restored owner sessions do not fetch customer addresses either', async () => {
  useAuth.setState({ hasHydrated: true, token: 'restored-owner-token' });
  await act(async () => {
    tree = create(<App />);
  });
  expect(mockGetPhysicalLocations).toHaveBeenCalledTimes(1);
  expect(mockGetAddresses).not.toHaveBeenCalled();
});
