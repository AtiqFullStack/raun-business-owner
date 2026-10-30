jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(),
    getRootState: jest.fn(),
    navigate: jest.fn(),
  },
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return {
    useAuth: create(() => ({
      user: { id: 'provider', userAuthId: 'identity' },
    })),
  };
});
import { navigationRef } from '../src/navigation/navigationRef';
import {
  openDemandNotification,
  clearDemandNotification,
  flushDemandNotification,
} from '../src/services/demandNotificationNavigation';
import { useAuth } from '../src/store/useAuth';
const event = {
  sourceModel: 'DemandBooking',
  bookingId: 'booking',
  providerId: 'provider',
};
beforeEach(() => {
  jest.clearAllMocks();
  clearDemandNotification();
  useAuth.setState({
    user: { id: 'provider', userAuthId: 'identity' } as never,
  });
  (navigationRef.isReady as jest.Mock).mockReturnValue(true);
  (navigationRef.getRootState as jest.Mock).mockReturnValue({
    index: 0,
    routes: [{ name: 'app' }],
  });
});
test('a notification opens the real owner booking details', () => {
  openDemandNotification(event);
  expect(navigationRef.navigate).toHaveBeenCalledWith('app', {
    screen: 'MyBookings',
    params: { screen: 'BookingDetails', params: { bookingId: 'booking' } },
  });
});
test('a cold notification waits for splash routing before opening the booking', () => {
  (navigationRef.getRootState as jest.Mock).mockReturnValue({
    index: 0,
    routes: [{ name: 'splash' }],
  });
  openDemandNotification(event);
  expect(navigationRef.navigate).not.toHaveBeenCalled();
  (navigationRef.getRootState as jest.Mock).mockReturnValue({
    index: 0,
    routes: [{ name: 'app' }],
  });
  flushDemandNotification();
  expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
});
test('another owner notification never opens in the current account', () => {
  openDemandNotification({ ...event, providerId: 'another-owner' });
  expect(navigationRef.navigate).not.toHaveBeenCalled();
});
