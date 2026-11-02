jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return { useAuth: create(() => ({ token: 'token', user: { id: 'owner' } })) };
});
jest.mock('../src/services/socketService', () => ({
  socket: { on: jest.fn(), off: jest.fn() },
  connectSocket: jest.fn(),
}));
jest.mock('../src/services/bookingChatService', () => ({
  useBookingChatService: () => ({
    getMessages: mockGet,
    sendMessage: mockSend,
    markAsRead: mockRead,
  }),
}));
import React from 'react';
import { AppState } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import useBookingChat from '../src/hooks/useBookingChat';
import { socket } from '../src/services/socketService';
import { useAuth } from '../src/store/useAuth';
const mockGet = jest.fn(),
  mockSend = jest.fn(),
  mockRead = jest.fn();
let chat: ReturnType<typeof useBookingChat>, tree: ReactTestRenderer;
const row = (id: string, senderId = 'customer') => ({
  _id: id,
  orderId: 'order',
  senderId,
  message: `Text ${id}`,
  createdAt: '2026-11-02T00:00:00Z',
  status: 'sent',
});
const history = (
  messages: any[] = [],
  nextBefore: string | null = null,
  canSend = true,
) => ({
  orderId: 'order',
  sourceId: 'booking',
  messages,
  canSend,
  pagination: { hasMore: !!nextBefore, nextBefore },
});
function Harness() {
  chat = useBookingChat('order');
  return null;
}
const event = (name: string) =>
  (socket.on as jest.Mock).mock.calls.find(([key]) => key === name)![1];
beforeEach(async () => {
  jest.clearAllMocks();
  (AppState as any).currentState = 'active';
  useAuth.setState({ token: 'token', user: { id: 'owner' } as any });
  mockGet.mockResolvedValue(history());
  mockRead.mockResolvedValue({});
  await act(async () => {
    tree = create(<Harness />);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
test('messages persist on load and incoming socket updates merge without duplicates', async () => {
  mockGet.mockResolvedValue(history([row('one')]));
  await act(async () => event('CHAT_MESSAGE')({ orderId: 'other-order' }));
  expect(mockGet).toHaveBeenCalledTimes(1);
  await act(async () => event('CHAT_MESSAGE')({ orderId: 'order' }));
  await act(async () => event('CHAT_MESSAGE')({ orderId: 'order' }));
  expect(chat.messages.map(message => message._id)).toEqual(['one']);
  expect(mockRead).toHaveBeenCalledWith('order', 'one');
});
test('failed sends can be retried with the same reference and rapid retries send once', async () => {
  mockSend.mockRejectedValueOnce({ message: 'Connection lost' });
  await act(async () => chat.send('Hello'));
  const failed = chat.messages[0];
  expect(failed.status).toBe('failed');
  let resolve: (value: any) => void = () => {};
  mockSend.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  let pending: Promise<void>;
  await act(async () => {
    pending = chat.send(failed.message, failed);
    chat.send(failed.message, failed);
  });
  expect(mockSend).toHaveBeenCalledTimes(2);
  expect(mockSend.mock.calls[1][2]).toBe(mockSend.mock.calls[0][2]);
  await act(async () => {
    resolve({
      ...row('saved', 'owner'),
      clientMessageId: failed.clientMessageId,
    });
    await pending!;
  });
  expect(chat.messages).toHaveLength(1);
  expect(chat.messages[0].status).toBe('sent');
  await act(async () =>
    event('CHAT_READ')({
      orderId: 'order',
      readerId: 'customer',
      lastMessageId: 'saved',
    }),
  );
  expect(chat.messages[0].status).toBe('read');
});
test('older history stays loaded on refresh and an exhausted cursor stays exhausted', async () => {
  mockGet.mockResolvedValueOnce(history([row('new')], 'cursor'));
  await act(async () => {
    tree.unmount();
    tree = create(<Harness />);
  });
  mockGet.mockResolvedValueOnce(history([row('old')]));
  await act(async () => chat.loadOlder());
  expect(mockGet).toHaveBeenLastCalledWith('order', 'cursor');
  expect(chat.hasMore).toBe(false);
  mockGet.mockResolvedValueOnce(history([row('new')], 'cursor'));
  await act(async () => chat.refresh());
  expect(chat.messages).toHaveLength(2);
  expect(chat.hasMore).toBe(false);
});
test('ended bookings are read only and empty messages never send', async () => {
  mockGet.mockResolvedValueOnce(history([], null, false));
  await act(async () => chat.refresh());
  await act(async () => {
    chat.send('Hello');
    chat.send(' ');
  });
  expect(chat.canSend).toBe(false);
  expect(mockSend).not.toHaveBeenCalled();
});
test('a response from a previous account cannot populate the next session', async () => {
  let resolve: (value: any) => void = () => {};
  mockGet.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  let pending: Promise<void>;
  await act(async () => {
    pending = chat.refresh();
  });
  await act(async () => {
    useAuth.setState({ token: 'different', user: { id: 'another' } as any });
  });
  await act(async () => {
    resolve(history([row('private')]));
    await pending!;
  });
  expect(chat.messages.some(message => message._id === 'private')).toBe(false);
});
