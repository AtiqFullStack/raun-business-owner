jest.mock('../src/hooks/useAxios', () => ({
  __esModule: true,
  default: () => ({ fetchData: mockFetch }),
}));
import React from 'react';
import axios from 'axios';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { API_BASE_URL } from '../src/var/config';
import { useBookingChatService } from '../src/services/bookingChatService';
const mockFetch = jest.fn();
let service: ReturnType<typeof useBookingChatService>, tree: ReactTestRenderer;
function Harness() {
  service = useBookingChatService();
  return null;
}
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('owner chat requests resolve under the existing API prefix and preserve retry IDs', async () => {
  await act(async () => {
    tree = create(<Harness />);
  });
  mockFetch.mockResolvedValueOnce({
    success: true,
    data: { messages: [], pagination: { hasMore: false }, canSend: true },
  });
  await service.getMessages('order');
  expect(
    axios.getUri({
      baseURL: API_BASE_URL,
      url: mockFetch.mock.calls[0][0].url,
    }),
  ).toBe('https://raunbn.com/backend/api/chat/order/messages');
  mockFetch.mockResolvedValueOnce({
    success: true,
    data: { message: { _id: 'saved' } },
  });
  await service.sendMessage('order', 'Hello', 'retry-id');
  expect(mockFetch.mock.calls[1][0]).toMatchObject({
    url: '/chat/order/messages',
    method: 'POST',
    service: false,
    data: { message: 'Hello', clientMessageId: 'retry-id' },
  });
});
