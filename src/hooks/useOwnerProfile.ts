import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  useOwnerProfileService,
  type OwnerProfile,
} from '../services/ownerProfileService';
import { useAuth } from '../store/useAuth';
import { bookingError } from './useDemandBookings';

export default function useOwnerProfile() {
  const { getProfile } = useOwnerProfileService();
  const ownerId = useAuth(state => state.user?.id);
  const token = useAuth(state => state.token);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(false),
    generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await getProfile();
      if (
        active.current &&
        current === generation.current &&
        useAuth.getState().user?.id === ownerId &&
        useAuth.getState().token === token &&
        result._id === ownerId
      )
        setProfile(result);
    } catch (err) {
      if (active.current && current === generation.current)
        setError(bookingError(err));
    } finally {
      if (active.current && current === generation.current) setLoading(false);
    }
  }, [getProfile, ownerId, token]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setProfile(null);
      if (ownerId && token) refresh();
      else {
        setLoading(false);
        setError('Please log in to view your profile.');
      }
      return () => {
        active.current = false;
        generation.current++;
      };
    }, [refresh, ownerId, token]),
  );
  return { profile, loading, error, refresh };
}
