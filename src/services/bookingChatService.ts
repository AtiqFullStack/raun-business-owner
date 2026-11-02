import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
export type BookingChatMessage = {
  _id: string;
  orderId: string;
  senderId: string;
  clientMessageId?: string;
  message: string;
  createdAt: string;
  status: 'sending' | 'failed' | 'sent' | 'delivered' | 'read';
};
export type BookingChatHistory = {
  orderId: string;
  sourceId: string;
  messages: BookingChatMessage[];
  canSend: boolean;
  pagination: { hasMore: boolean; nextBefore: string | null };
};
export function useBookingChatService() {
  const { fetchData } = useAxios();
  const getMessages = useCallback(
    async (orderId: string, before?: string) => {
      const response = await fetchData<BookingChatHistory>({
        url: `/chat/${orderId}/messages`,
        params: { latest: true, limit: 30, ...(before ? { before } : {}) },
        service: false,
      });
      if (
        String(response.success) !== 'true' ||
        !Array.isArray(response.data?.messages)
      )
        throw new Error(
          response.message || 'Unable to load your conversation.',
        );
      return response.data;
    },
    [fetchData],
  );
  const sendMessage = useCallback(
    async (orderId: string, message: string, clientMessageId: string) => {
      const response = await fetchData<{ message: BookingChatMessage }>({
        url: `/chat/${orderId}/messages`,
        method: 'POST',
        data: { message, clientMessageId },
        service: false,
      });
      if (String(response.success) !== 'true' || !response.data?.message?._id)
        throw new Error(
          response.message || 'Unable to send your message. Please try again.',
        );
      return response.data.message;
    },
    [fetchData],
  );
  const markAsRead = useCallback(
    (orderId: string, lastMessageId: string) =>
      fetchData({
        url: `/chat/${orderId}/read`,
        method: 'PUT',
        data: { lastMessageId },
        service: false,
      }),
    [fetchData],
  );
  return { getMessages, sendMessage, markAsRead };
}
