jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
  useNavigation: () => mockNavigation,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('lucide-react-native', () => ({
  Bell: () => null,
  Menu: () => null,
  LogOut: () => null,
  ArrowUpRight: () => null,
  CalendarDays: () => null,
  CalendarCheck2: () => null,
  ChevronRight: () => null,
  Clock3: () => null,
  Wallet: () => null,
}));
jest.mock('../src/assets/svg/Logo.svg', () => () => null);
jest.mock('../src/navigation/navigationRef', () => ({ resetTo: jest.fn() }));
jest.mock('../src/components/KeyboardWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('../src/services/socketService', () => ({
  socket: { on: jest.fn(), off: jest.fn() },
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return {
    useAuth: create(() => ({
      ownerType: 'SERVICE_PROVIDER',
      user: { id: 'provider', name: 'Real Owner' },
      logout: jest.fn(),
    })),
  };
});
jest.mock('../src/services/demandBookingService', () => ({
  ...jest.requireActual('../src/services/demandBookingService'),
  useDemandBookingService: () => ({
    getDashboard: mockGetDashboard,
    updateBooking: mockUpdateBooking,
  }),
}));
import React from 'react';
import { DeviceEventEmitter, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import HomeScreen from '../src/pages/HomeScreen';
import { useAuth } from '../src/store/useAuth';
const mockNavigation = { navigate: jest.fn() },
  mockGetDashboard = jest.fn(),
  mockUpdateBooking = jest.fn();
const data = {
  profile: { name: 'Real Professional', currency: 'BND' },
  metrics: {
    bookings: 12,
    completed: 4,
    newBookings: 2,
    pending: 3,
    cancelled: 1,
    revenueToday: [{ currency: 'BND', amount: 30 }],
  },
  todayTotal: 1,
  today: [
    {
      _id: 'new-booking',
      bookingNumber: 'DS-100',
      estimate: { totalAmount: 25, currency: 'BND', durationMinutes: 60 },
      serviceTypeName: 'Plumber',
      scheduledAt: '2030-10-30T03:30:00Z',
      status: 'pending',
      customer: { name: 'Pending Customer' },
      serviceAddress: { formattedAddress: 'Central Road' },
    },
  ],
  upcoming: [
    {
      _id: 'booking',
      bookingNumber: 'DS-101',
      estimate: { totalAmount: 30, currency: 'BND', durationMinutes: 60 },
      serviceTypeName: 'Electrician',
      scheduledAt: '2030-10-30T03:30:00Z',
      status: 'confirmed',
      customer: { name: 'Actual Customer' },
      serviceAddress: { formattedAddress: 'Central Road' },
    },
  ],
};
let tree: ReactTestRenderer;
const text = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({
    ownerType: 'SERVICE_PROVIDER',
    user: { id: 'provider', name: 'Real Owner' } as never,
  });
  mockGetDashboard.mockResolvedValue(data);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('Service Provider dashboard shows six real metrics, today requests and notifications action', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  expect(mockGetDashboard).toHaveBeenCalledTimes(1);
  for (const label of [
    'Booking',
    'Completed',
    'Revenue Today',
    'New Booking',
    'Pending',
    'Cancelled',
    'Upcoming Booking',
    'Pending Customer',
    'B$ 30.00',
  ])
    expect(text()).toContain(label);
  expect(text()).not.toContain('20%');
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: 'Open notifications' })
      .props.onPress(),
  );
  expect(mockNavigation.navigate).toHaveBeenCalledWith('Notification');
});
test('BUSINESS accounts keep the business dashboard without requesting the provider dashboard', async () => {
  useAuth.setState({ ownerType: 'BUSINESS' });
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  expect(mockGetDashboard).not.toHaveBeenCalled();
  expect(text()).toContain('New Orders');
  expect(text()).not.toContain('Paid services');
});
test('provider dashboard metrics refresh after a realtime booking change', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  mockGetDashboard.mockResolvedValue({ ...data, today: [], todayTotal: 0 });
  await act(async () => {
    DeviceEventEmitter.emit('demandBookingUpdated', { bookingId: 'booking' });
  });
  expect(text()).toContain('No bookings today');
  expect(text()).not.toContain('Pending Customer');
});

test('today pending bookings show New status and View all opens every status for today', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  expect(text()).toContain('Today’s Bookings');
  expect(text()).toContain('Pending Customer');
  expect(text()).toContain('New');
  expect(text()).toContain('Decline');
  expect(text()).toContain('Accept');
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: 'View all Today’s Bookings' })
      .props.onPress(),
  );
  expect(mockNavigation.navigate).toHaveBeenCalledWith('MyBookings', {
    screen: 'Booking',
    params: { status: 'all', period: 'today' },
  });
});

async function press(label: string) {
  let node = tree.root
    .findAllByType(Text)
    .find(item => item.props.children === label);
  while (node && !node.props.onPress) node = node.parent || undefined;
  expect(node).toBeDefined();
  await act(async () => {
    await node!.props.onPress();
  });
}
test('Upcoming tab shows future appointments and opens the actual booking', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  expect(text()).not.toContain('Actual Customer');
  await press('Upcoming Booking');
  expect(text()).toContain('Actual Customer');
  expect(text()).toContain('Accepted');
  expect(text()).not.toContain('Pending Customer');
  await act(async () =>
    tree.root
      .findByProps({
        accessibilityLabel: 'View Electrician booking for Actual Customer',
      })
      .props.onPress(),
  );
  expect(mockNavigation.navigate).toHaveBeenCalledWith('MyBookings', {
    screen: 'BookingDetails',
    params: { bookingId: 'booking' },
  });
});
test('home pending action uses the booking API and refreshes status from the server', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  mockUpdateBooking.mockResolvedValue({
    ...data.today[0],
    status: 'confirmed',
  });
  mockGetDashboard.mockResolvedValue({
    ...data,
    today: [{ ...data.today[0], status: 'confirmed' }],
  });
  await press('Accept');
  expect(mockUpdateBooking).toHaveBeenCalledWith('new-booking', 'accept');
  expect(mockGetDashboard).toHaveBeenCalledTimes(2);
  expect(text()).toContain('Accepted');
  expect(text()).not.toContain('Decline');
});
test('pending summary opens pending requests across dates', async () => {
  await act(async () => {
    tree = create(<HomeScreen />);
  });
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: 'View pending' })
      .props.onPress(),
  );
  expect(mockNavigation.navigate).toHaveBeenCalledWith('MyBookings', {
    screen: 'Booking',
    params: { status: 'pending', period: undefined },
  });
});
