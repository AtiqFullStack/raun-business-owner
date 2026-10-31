jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
  ArrowUpRight: () => null,
  Banknote: () => null,
  CalendarDays: () => null,
  Clock3: () => null,
  MapPin: () => null,
  StickyNote: () => null,
  Wrench: () => null,
  Search: () => null,
  X: () => null,
  Phone: () => null,
  MessageSquare: () => null,
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/components/CommonHeader', () => ({
  __esModule: true,
  default: ({ title, left, right }: any) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        {left}
        <Text>{title}</Text>
        {right}
      </View>
    );
  },
}));
jest.mock('../src/components/KeyboardWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('../src/services/socketService', () => ({
  socket: { on: jest.fn(), off: jest.fn() },
}));
jest.mock('../src/services/demandBookingService', () => ({
  ...jest.requireActual('../src/services/demandBookingService'),
  useDemandBookingService: () => ({
    getBookings: mockGetBookings,
    getBooking: mockGetBooking,
    updateBooking: mockUpdateBooking,
  }),
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return {
    useAuth: create(() => ({
      user: { id: 'provider' },
      ownerType: 'SERVICE_PROVIDER',
      token: 'token',
    })),
  };
});
jest.mock('react-native/Libraries/Lists/FlatList', () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return (
      <View>
        {props.data.length
          ? props.data.map((item: any) => (
              <React.Fragment key={item._id}>
                {props.renderItem({ item })}
              </React.Fragment>
            ))
          : props.ListEmptyComponent}
      </View>
    );
  },
}));
import React from 'react';
import { DeviceEventEmitter, Linking, Text, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import BookingScreen from '../src/pages/BookingScreen';
import BookingDetailsScreen from '../src/pages/BookingDetailsScreen';
import { useAuth } from '../src/store/useAuth';
const mockGetBookings = jest.fn(),
  mockGetBooking = jest.fn(),
  mockUpdateBooking = jest.fn();
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const booking = {
  _id: 'booking',
  unifiedOrderId: 'order',
  bookingNumber: 'DS-123',
  customerId: 'customer',
  providerId: 'provider',
  serviceTypeName: 'Electrician',
  scheduledAt: '2030-10-30T03:30:00Z',
  status: 'pending',
  estimate: { totalAmount: 30, currency: 'BND', durationMinutes: 60 },
  serviceAddress: {
    formattedAddress: 'Central Road',
    contactName: 'Actual Customer',
  },
  notes: 'Call on arrival',
  paymentStatus: 'unpaid',
};
let tree: ReactTestRenderer;
const text = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ')
    .replace(/\s+/g, ' ');
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
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({
    user: { id: 'provider' } as never,
    ownerType: 'SERVICE_PROVIDER',
    token: 'token',
  });
  mockGetBookings.mockResolvedValue({
    bookings: [booking],
    pagination: { page: 1, totalPages: 1, total: 1 },
  });
  mockGetBooking.mockResolvedValue(booking);
  mockUpdateBooking.mockResolvedValue({ ...booking, status: 'confirmed' });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
async function mountList() {
  await act(async () => {
    tree = create(
      <BookingScreen navigation={navigation as never} route={{} as never} />,
    );
  });
}
test('loads real pending bookings and changes server filters for Accepted and Cancelled tabs', async () => {
  await mountList();
  expect(mockGetBookings).toHaveBeenLastCalledWith('pending', 1);
  expect(text()).toContain('Actual Customer');
  await press('Accepted');
  expect(mockGetBookings).toHaveBeenLastCalledWith('confirmed', 1);
  await press('Cancelled');
  expect(mockGetBookings).toHaveBeenLastCalledWith('cancelled', 1);
});
test('Accept and Decline call the owner booking endpoints instead of changing local sample statuses', async () => {
  await mountList();
  await press('Accept');
  expect(mockUpdateBooking).toHaveBeenCalledWith('booking', 'accept');
  await press('Decline');
  expect(mockUpdateBooking).toHaveBeenCalledWith('booking', 'reject');
});
test('detail loads actual booking, instructions, amount, payment state and accepts it', async () => {
  await act(async () => {
    tree = create(
      <BookingDetailsScreen
        navigation={navigation as never}
        route={{ params: { bookingId: 'booking' } } as never}
      />,
    );
  });
  expect(mockGetBooking).toHaveBeenCalledWith('booking');
  expect(text()).toContain('Call on arrival');
  expect(text()).toContain('B$ 30.00');
  expect(text()).toContain('Unpaid');
  await press('Accept');
  expect(mockUpdateBooking).toHaveBeenCalledWith('booking', 'accept');
});
test('focused bookings refresh on realtime events and discard previous filter records', async () => {
  await mountList();
  mockGetBookings.mockResolvedValue({
    bookings: [],
    pagination: { page: 1, totalPages: 0, total: 0 },
  });
  await act(async () => {
    DeviceEventEmitter.emit('demandBookingUpdated', { bookingId: 'booking' });
  });
  expect(text()).not.toContain('DS-123');
  expect(text()).toContain('No new bookings');
});
test('rapid Accept taps submit once and show server conflicts', async () => {
  await mountList();
  let reject!: (error: Error) => void;
  mockUpdateBooking.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  let button = tree.root
    .findAllByType(Text)
    .find(item => item.props.children === 'Accept');
  while (button && !button.props.onPress) button = button.parent || undefined;
  await act(async () => {
    button!.props.onPress();
    button!.props.onPress();
  });
  expect(mockUpdateBooking).toHaveBeenCalledTimes(1);
  await act(async () =>
    reject(new Error('This booking has already changed. Please refresh.')),
  );
  expect(text()).toContain('This booking has already changed. Please refresh.');
});

test('booking search uses the server filter after typing', async () => {
  jest.useFakeTimers();
  try {
    await mountList();
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: 'Search bookings' })
        .props.onPress();
    });
    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('Electrician');
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(mockGetBookings).toHaveBeenLastCalledWith(
      'pending',
      1,
      'Electrician',
    );
  } finally {
    jest.useRealTimers();
  }
});
test('booking detail contact and map buttons use actual customer data', async () => {
  mockGetBooking.mockResolvedValue({
    ...booking,
    customer: { name: 'Actual Customer', phoneNumber: '+6731234567' },
  });
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  try {
    await act(async () => {
      tree = create(
        <BookingDetailsScreen
          navigation={navigation as never}
          route={{ params: { bookingId: 'booking' } } as never}
        />,
      );
    });
    await act(async () => {
      await tree.root
        .findByProps({ accessibilityLabel: 'Call customer' })
        .props.onPress();
    });
    expect(open).toHaveBeenCalledWith('tel:+6731234567');
    await act(async () => {
      await tree.root
        .findByProps({ accessibilityLabel: 'Message customer' })
        .props.onPress();
    });
    expect(open).toHaveBeenCalledWith('sms:+6731234567');
    await press('View On Map');
    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Central%20Road',
    );
  } finally {
    open.mockRestore();
  }
});

test('today View all loads every status while status tabs retain the day filter', async () => {
  await act(async () => {
    tree = create(
      <BookingScreen
        navigation={navigation as never}
        route={{ params: { status: 'all', period: 'today' } } as never}
      />,
    );
  });
  expect(mockGetBookings).toHaveBeenLastCalledWith('all', 1, '', 'today');
  expect(text()).toContain('Today’s Bookings');
  await press('Accepted');
  expect(mockGetBookings).toHaveBeenLastCalledWith('confirmed', 1, '', 'today');
  await press('All');
  expect(mockGetBookings).toHaveBeenLastCalledWith('all', 1, '', 'today');
});
