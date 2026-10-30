import { useCallback, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { socket } from '../services/socketService';
import { useAuth } from '../store/useAuth';
import {
  useDemandBookingService,
  type BookingStatus,
  type DemandBooking,
} from '../services/demandBookingService';
export const bookingError = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Unable to load bookings.';
export default function useDemandBookings(status: BookingStatus | 'all') {
  const { getBookings } = useDemandBookingService();
  const ownerId = useAuth(state => state.user?.id);
  const [items, setItems] = useState<DemandBooking[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [total, setTotal] = useState(0);
  const generation = useRef(0),
    active = useRef(false),
    busy = useRef(false),
    queued = useRef(false),
    pages = useRef({ page: 0, total: 1 });
  const load = useCallback(
    async (append = false) => {
      if (busy.current) {
        if (!append) queued.current = true;
        return;
      }
      if (
        !active.current ||
        (append && pages.current.page >= pages.current.total)
      )
        return;
      const current = generation.current;
      busy.current = true;
      setLoading(true);
      setError('');
      try {
        const result = await getBookings(
          status,
          append ? pages.current.page + 1 : 1,
        );
        if (
          !active.current ||
          current !== generation.current ||
          useAuth.getState().user?.id !== ownerId
        )
          return;
        setItems(previous =>
          append
            ? [
                ...previous,
                ...result.bookings.filter(
                  item => !previous.some(old => old._id === item._id),
                ),
              ]
            : result.bookings,
        );
        pages.current = {
          page: result.pagination.page,
          total: result.pagination.totalPages,
        };
        setTotal(result.pagination.total);
      } catch (err) {
        if (active.current && current === generation.current)
          setError(bookingError(err));
      } finally {
        if (active.current && current === generation.current) {
          busy.current = false;
          setLoading(false);
          if (queued.current) {
            queued.current = false;
            load();
          }
        }
      }
    },
    [getBookings, ownerId, status],
  );
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      generation.current++;
      busy.current = false;
      queued.current = false;
      pages.current = { page: 0, total: 1 };
      setItems([]);
      setTotal(0);
      if (!ownerId) {
        setLoading(false);
        setError('Please log in to view bookings.');
        return;
      }
      load();
      const subscription = DeviceEventEmitter.addListener(
        'demandBookingUpdated',
        () => load(),
      );
      const reconnect = () => load();
      socket.on('connect', reconnect);
      return () => {
        active.current = false;
        generation.current++;
        subscription.remove();
        socket.off('connect', reconnect);
      };
    }, [load, ownerId]),
  );
  return {
    items,
    total,
    loading,
    error,
    refresh: () => load(),
    loadMore: () => load(true),
  };
}
