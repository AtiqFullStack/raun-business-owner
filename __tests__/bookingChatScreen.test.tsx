jest.mock('../src/hooks/useBookingChat', () => ({
  __esModule: true,
  default: () => mockChat,
}));
jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
  Send: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
import React from 'react';
import { FlatList, StyleSheet, Text, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import BookingChat from '../src/pages/BookingChat';
let mockChat: any, tree: ReactTestRenderer;
const copy = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .join(' ');
beforeEach(() => {
  mockChat = {
    messages: [],
    loading: false,
    ready: true,
    canSend: true,
    error: '',
    hasMore: false,
    myId: 'owner',
    refresh: jest.fn(),
    send: jest.fn(),
  };
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
async function mount() {
  await act(async () => {
    tree = create(
      <BookingChat
        route={{ params: { orderId: 'order' } }}
        navigation={{ goBack: jest.fn() }}
      />,
    );
  });
}
test('empty conversation renders outside the inverted message list with no text transform', async () => {
  await mount();
  expect(copy()).toContain('Start a conversation');
  expect(tree.root.findAllByType(FlatList)).toHaveLength(0);
  expect(
    StyleSheet.flatten(
      tree.root.findByProps({ testID: 'booking-chat-empty' }).props.style,
    ).transform,
  ).toBeUndefined();
  expect(tree.root.findByType(TextInput).props.editable).toBe(true);
});
test('ended empty bookings explain that messaging is closed without inviting a new conversation', async () => {
  mockChat.canSend = false;
  await mount();
  expect(copy()).toContain('No messages for this booking');
  expect(copy()).toContain('Messaging is closed for this booking.');
  expect(copy()).not.toContain('Start a conversation');
  expect(tree.root.findAllByType(TextInput)).toHaveLength(0);
});
test('an unavailable conversation does not falsely say that the booking has ended', async () => {
  mockChat.ready = false;
  mockChat.canSend = false;
  mockChat.error = 'Unable to connect.';
  await mount();
  expect(copy()).toContain('Conversation unavailable');
  expect(copy()).not.toContain('booking ended');
  expect(copy()).not.toContain('Messaging is closed');
});
