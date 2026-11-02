import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/useAuth';
import { socket, connectSocket } from '../services/socketService';
import {
  useBookingChatService,
  type BookingChatMessage,
} from '../services/bookingChatService';

const errorText = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Unable to load your conversation. Please try again.';
export function mergeChatMessages(
  current: BookingChatMessage[],
  incoming: BookingChatMessage[],
) {
  const rows = [...current];
  for (const message of incoming) {
    const index = rows.findIndex(
      row =>
        row._id === message._id ||
        (!!message.clientMessageId &&
          row.clientMessageId === message.clientMessageId &&
          row.senderId === message.senderId),
    );
    if (index < 0) rows.push(message);
    else
      rows[index] = {
        ...message,
        status: rows[index].status === 'read' ? 'read' : message.status,
      };
  }
  return rows.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime() || right._id.localeCompare(left._id),
  );
}
export default function useBookingChat(orderId: string) {
  const token = useAuth(state => state.token);
  const myId = useAuth(state => state.user?.id || '');
  const { getMessages, sendMessage, markAsRead } = useBookingChatService();
  const [messages, setMessages] = useState<BookingChatMessage[]>([]);
  const [loading, setLoading] = useState(true),
    [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState(''),
    [canSend, setCanSend] = useState(false),
    [ready, setReady] = useState(false);
  const [before, setBefore] = useState<string | null>(null);
  const active = useRef(false),
    generation = useRef(0),
    loadingLatest = useRef(false);
  const historyInitialized = useRef(false);
  const sending = useRef(new Set<string>()),
    olderLock = useRef(false);
  const valid = useCallback(
    (version: number) =>
      active.current &&
      generation.current === version &&
      useAuth.getState().token === token &&
      useAuth.getState().user?.id === myId,
    [token, myId],
  );
  const refresh = useCallback(async () => {
    if (loadingLatest.current || !active.current) return;
    loadingLatest.current = true;
    const version = generation.current;
    try {
      const history = await getMessages(orderId);
      if (!valid(version)) return;
      setMessages(current => mergeChatMessages(current, history.messages));
      setCanSend(history.canSend);
      setReady(true);
      setError('');
      if (!historyInitialized.current) {
        setBefore(history.pagination.nextBefore);
        historyInitialized.current = true;
      }
      const last = history.messages[history.messages.length - 1];
      if (last) markAsRead(orderId, last._id).catch(() => {});
    } catch (err) {
      if (valid(version)) setError(errorText(err));
    } finally {
      if (valid(version)) {
        loadingLatest.current = false;
        setLoading(false);
      }
    }
  }, [getMessages, markAsRead, orderId, valid]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      generation.current++;
      loadingLatest.current = false;
      historyInitialized.current = false;
      setReady(false);
      setMessages([]);
      setBefore(null);
      setLoading(true);
      setCanSend(false);
      setError('');
      setLoadingOlder(false);
      olderLock.current = false;
      if (token) connectSocket(token);
      refresh();
      const onMessage = (event: { orderId?: string; sourceId?: string }) => {
        if (
          (event.orderId === orderId || event.sourceId === orderId) &&
          AppState.currentState === 'active'
        )
          refresh();
      };
      const onRead = (event: {
        orderId?: string;
        sourceId?: string;
        readerId?: string;
        lastMessageId?: string;
      }) => {
        if (
          (event.orderId !== orderId && event.sourceId !== orderId) ||
          event.readerId === myId ||
          !valid(generation.current)
        )
          return;
        setMessages(rows =>
          rows.map(row =>
            row.senderId === myId &&
            row.status !== 'sending' &&
            row.status !== 'failed' &&
            (!event.lastMessageId || row._id <= event.lastMessageId)
              ? { ...row, status: 'read' }
              : row,
          ),
        );
      };
      const appState = AppState.addEventListener('change', state => {
        if (state === 'active') refresh();
      });
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') refresh();
      }, 15000);
      socket.on('CHAT_MESSAGE', onMessage);
      socket.on('CHAT_READ', onRead);
      socket.on('connect', refresh);
      return () => {
        active.current = false;
        generation.current++;
        loadingLatest.current = false;
        clearInterval(timer);
        appState.remove();
        socket.off('CHAT_MESSAGE', onMessage);
        socket.off('CHAT_READ', onRead);
        socket.off('connect', refresh);
      };
    }, [myId, orderId, refresh, token, valid]),
  );
  const loadOlder = async () => {
    if (!before || olderLock.current || loading) return;
    olderLock.current = true;
    setLoadingOlder(true);
    const version = generation.current;
    try {
      const history = await getMessages(orderId, before);
      if (valid(version)) {
        setMessages(rows => mergeChatMessages(rows, history.messages));
        setBefore(history.pagination.nextBefore);
        setError('');
      }
    } catch (err) {
      if (valid(version)) setError(errorText(err));
    } finally {
      if (valid(version)) {
        olderLock.current = false;
        setLoadingOlder(false);
      }
    }
  };
  const send = async (text: string, retry?: BookingChatMessage) => {
    const body = text.trim();
    if (!body || body.length > 1000 || !canSend || !valid(generation.current)) return;
    const clientMessageId =
      retry?.clientMessageId ||
      `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (sending.current.has(clientMessageId)) return;
    sending.current.add(clientMessageId);
    const version = generation.current;
    const local: BookingChatMessage = {
      _id: retry?._id || `local_${clientMessageId}`,
      orderId,
      senderId: myId,
      clientMessageId,
      message: body,
      createdAt: retry?.createdAt || new Date().toISOString(),
      status: 'sending',
    };
    setMessages(rows => mergeChatMessages(rows, [local]));
    try {
      const saved = await sendMessage(orderId, body, clientMessageId);
      if (valid(version)) {
        setMessages(rows => mergeChatMessages(rows, [saved]));
        setError('');
      }
    } catch (err) {
      if (valid(version)) {
        setMessages(rows =>
          rows.map(row =>
            row.clientMessageId === clientMessageId && row.status === 'sending'
              ? { ...row, status: 'failed' }
              : row,
          ),
        );
        setError(errorText(err));
        refresh();
      }
    } finally {
      sending.current.delete(clientMessageId);
    }
  };
  return {
    ready,
    messages,
    loading,
    loadingOlder,
    error,
    canSend,
    hasMore: !!before,
    myId,
    send,
    refresh,
    loadOlder,
  };
}
