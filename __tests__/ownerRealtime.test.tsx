jest.mock('../src/hooks/useAxios', () => ({
  __esModule: true,
  default: () => ({ fetchData: mockFetchData }),
}));
jest.mock('../src/services/socketService', () => ({
  socket: { on: jest.fn(), off: jest.fn() },
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
}));
jest.mock('../src/services/demandNotificationNavigation', () => ({
  clearDemandNotification: jest.fn(),
  flushDemandNotification: jest.fn(),
  openDemandNotification: jest.fn(),
}));
jest.mock('@react-native-firebase/app', () => ({
  getApps: () => mockGetApps(),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: () => ({}),
  getToken: jest.fn().mockResolvedValue('device-fcm'),
  onMessage: jest.fn(() => () => {}),
  onNotificationOpenedApp: jest.fn(() => () => {}),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  onTokenRefresh: jest.fn(() => () => {}),
  requestPermission: jest.fn().mockResolvedValue(1),
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return {
    useAuth: create(() => ({
      user: { id: 'provider' },
      hasHydrated: true,
      token: 'owner-token',
    })),
  };
});
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import useOwnerRealtime from '../src/hooks/useOwnerRealtime';
import { useAuth } from '../src/store/useAuth';
import {
  socket,
  connectSocket,
  disconnectSocket,
} from '../src/services/socketService';
import { useOwnerNotifications } from '../src/store/useOwnerNotifications';
import { onTokenRefresh } from '@react-native-firebase/messaging';
const mockFetchData = jest.fn(),
  mockGetApps = jest.fn();
let tree: ReactTestRenderer;
function Harness() {
  useOwnerRealtime();
  return null;
}
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({
    user: { id: 'provider' } as never,
    token: 'owner-token',
    hasHydrated: true,
  });
  mockFetchData.mockResolvedValue({
    success: true,
    data: { userAuthId: 'identity', verificationStatus: 'APPROVED' },
  });
  mockGetApps.mockReturnValue([]);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('upgrades a restored owner session before connecting its UserAuth socket and resets notices on logout', async () => {
  await act(async () => {
    tree = create(<Harness />);
  });
  expect(mockFetchData).toHaveBeenCalledWith(
    expect.objectContaining({ url: '/business-owners/me' }),
  );
  expect(connectSocket).toHaveBeenCalledWith('owner-token');
  const handler = (socket.on as jest.Mock).mock.calls.find(
    call => call[0] === 'DEMAND_BOOKING_UPDATED',
  )![1];
  await act(async () =>
    handler({
      sourceModel: 'DemandBooking',
      bookingId: 'booking',
      providerId: 'provider',
      status: 'pending',
    }),
  );
  expect(useOwnerNotifications.getState().items).toHaveLength(1);
  await act(async () =>
    handler({
      sourceModel: 'DemandBooking',
      bookingId: 'other',
      providerId: 'someone-else',
      status: 'pending',
    }),
  );
  expect(useOwnerNotifications.getState().items).toHaveLength(1);
  await act(async () => {
    useAuth.setState({ user: null, token: null });
  });
  expect(disconnectSocket).toHaveBeenCalled();
  expect(useOwnerNotifications.getState().items).toHaveLength(0);
});
test('registers device and refreshed FCM tokens through the existing auth endpoint', async () => {
  mockGetApps.mockReturnValue([{}]);
  await act(async () => {
    tree = create(<Harness />);
  });
  expect(mockFetchData).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/auth/fcm-token',
      data: { fcmToken: 'device-fcm' },
    }),
  );
  const handler = (onTokenRefresh as jest.Mock).mock.calls[0][1];
  await act(async () => handler('refreshed-fcm'));
  expect(mockFetchData).toHaveBeenCalledWith(
    expect.objectContaining({ data: { fcmToken: 'refreshed-fcm' } }),
  );
});
test('pending owner sessions do not connect to protected socket or save push tokens', async () => {
  mockFetchData.mockResolvedValue({ data: { verificationStatus: 'PENDING' } });
  await act(async () => {
    tree = create(<Harness />);
  });
  expect(connectSocket).not.toHaveBeenCalled();
  expect(mockFetchData).toHaveBeenCalledTimes(1);
});

test('temporary initialization failure retries without adding duplicate socket listeners', async () => {
  jest.useFakeTimers();
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    mockFetchData.mockRejectedValueOnce(new Error('Offline'));
    await act(async () => {
      tree = create(<Harness />);
    });
    expect(connectSocket).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(connectSocket).toHaveBeenCalledTimes(1);
    expect(
      (socket.on as jest.Mock).mock.calls.filter(
        call => call[0] === 'DEMAND_BOOKING_UPDATED',
      ),
    ).toHaveLength(1);
  } finally {
    warning.mockRestore();
    jest.useRealTimers();
  }
});
