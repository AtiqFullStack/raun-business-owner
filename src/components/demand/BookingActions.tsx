import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useDemandBookingService,
  type DemandBooking,
} from '../../services/demandBookingService';
import { useAuth } from '../../store/useAuth';
import { bookingError } from '../../hooks/useDemandBookings';
export default function BookingActions({
  booking,
  onUpdated,
}: {
  booking: DemandBooking;
  onUpdated?: () => void;
}) {
  const { updateBooking } = useDemandBookingService();
  const [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const act = async (action: 'accept' | 'reject' | 'start' | 'complete') => {
    if (lock.current) return;
    const ownerId = useAuth.getState().user?.id;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await updateBooking(booking._id, action);
      if (!mounted.current || useAuth.getState().user?.id !== ownerId) return;
      DeviceEventEmitter.emit('demandBookingUpdated', {
        bookingId: booking._id,
      });
      onUpdated?.();
    } catch (err) {
      if (mounted.current && useAuth.getState().user?.id === ownerId)
        setError(bookingError(err));
    } finally {
      lock.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const actions =
    booking.status === 'pending'
      ? [
          { action: 'reject' as const, label: 'Decline' },
          { action: 'accept' as const, label: 'Accept' },
        ]
      : booking.status === 'confirmed'
      ? [{ action: 'start' as const, label: 'Start Service' }]
      : booking.status === 'in_progress'
      ? [{ action: 'complete' as const, label: 'Complete Service' }]
      : [];
  return (
    <View>
      <View style={styles.actions}>
        {actions.map(item => (
          <Pressable
            key={item.action}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
            disabled={saving}
            onPress={() => act(item.action)}
            style={[styles.action, item.action === 'reject' && styles.decline]}
          >
            <Text
              style={[
                styles.label,
                item.action === 'reject' && styles.declineLabel,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {saving && <ActivityIndicator color="#164C48" style={styles.spinner} />}
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12 },
  action: {
    flex: 1,
    backgroundColor: '#164C48',
    minHeight: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF7418',
  },
  label: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  declineLabel: { color: '#F57923' },
  error: { color: '#B54136', fontSize: 12, lineHeight: 18, marginTop: 10 },
  spinner: { marginTop: 10 },
});
