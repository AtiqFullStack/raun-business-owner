import { useCallback, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  useDemandBookingService,
  type DemandDashboardData,
} from '../services/demandBookingService';
import { useAuth } from '../store/useAuth';
import { socket } from '../services/socketService';
import { bookingError } from './useDemandBookings';
export default function useDemandDashboard() {
  const { getDashboard } = useDemandBookingService();
  const ownerId = useAuth(state => state.user?.id);
  const [data, setData] = useState<DemandDashboardData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const active = useRef(false),
    busy = useRef(false),
    queued = useRef(false),
    generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!active.current) return;
    if (busy.current) {
      queued.current = true;
      return;
    }
    busy.current = true;
    const current = generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await getDashboard();
      if (
        active.current &&
        current === generation.current &&
        useAuth.getState().user?.id === ownerId
      )
        setData(result);
    } catch (err) {
      if (active.current && current === generation.current)
        setError(bookingError(err));
    } finally {
      if (active.current && current === generation.current) {
        busy.current = false;
        setLoading(false);
        if (queued.current) {
          queued.current = false;
          refresh();
        }
      }
    }
  }, [getDashboard, ownerId]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      generation.current++;
      busy.current = false;
      queued.current = false;
      setData(null);
      refresh();
      const listener = DeviceEventEmitter.addListener(
        'demandBookingUpdated',
        () => refresh(),
      );
      socket.on('connect', refresh);
      return () => {
        active.current = false;
        generation.current++;
        listener.remove();
        socket.off('connect', refresh);
      };
    }, [refresh]),
  );
  return { data, loading, error, refresh };
}
