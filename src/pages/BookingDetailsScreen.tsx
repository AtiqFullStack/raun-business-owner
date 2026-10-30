import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import KeyboardWrapper from '../components/KeyboardWrapper';
import type { BookingStackParamList } from '../routes/TabNavigation';
import {
  bookingAmount,
  bookingStatusLabel,
  useDemandBookingService,
  type DemandBooking,
} from '../services/demandBookingService';
import { bookingError } from '../hooks/useDemandBookings';
import BookingActions from '../components/demand/BookingActions';
import { useAuth } from '../store/useAuth';
import { socket } from '../services/socketService';
type Props = NativeStackScreenProps<BookingStackParamList, 'BookingDetails'>;
export default function BookingDetailsScreen({ navigation, route }: Props) {
  const { getBooking } = useDemandBookingService();
  const ownerId = useAuth(state => state.user?.id);
  const [booking, setBooking] = useState<DemandBooking | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const active = useRef(false),
    generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await getBooking(route.params.bookingId);
      if (
        active.current &&
        generation.current === current &&
        useAuth.getState().user?.id === ownerId
      )
        setBooking(result);
    } catch (err) {
      if (active.current && generation.current === current)
        setError(bookingError(err));
    } finally {
      if (active.current && generation.current === current) setLoading(false);
    }
  }, [getBooking, ownerId, route.params.bookingId]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setBooking(null);
      refresh();
      const listener = DeviceEventEmitter.addListener(
        'demandBookingUpdated',
        event => {
          if (!event.bookingId || event.bookingId === route.params.bookingId)
            refresh();
        },
      );
      socket.on('connect', refresh);
      return () => {
        active.current = false;
        generation.current++;
        listener.remove();
        socket.off('connect', refresh);
      };
    }, [refresh, route.params.bookingId]),
  );
  return (
    <KeyboardWrapper>
      <CommonHeader
        title="Booking Details"
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
        }
      />
      {loading && !booking ? (
        <ActivityIndicator color="#164C48" style={styles.state} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!!error && (
            <View style={styles.state}>
              <Text style={styles.error}>{error}</Text>
              <Pressable onPress={refresh}>
                <Text style={styles.link}>Retry</Text>
              </Pressable>
            </View>
          )}
          {booking && (
            <View style={styles.card}>
              <Text style={styles.reference}>{booking.bookingNumber}</Text>
              <Text style={styles.badge}>
                {bookingStatusLabel(booking.status)}
              </Text>
              <Text style={styles.heading}>Customer</Text>
              <Text style={styles.value}>
                {booking.serviceAddress.contactName || 'Customer'}
              </Text>
              {!!booking.serviceAddress.phoneNumber && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    Linking.openURL(
                      `tel:${booking.serviceAddress.phoneNumber}`,
                    ).catch(() => {})
                  }
                >
                  <Text style={styles.link}>
                    {booking.serviceAddress.phoneNumber}
                  </Text>
                </Pressable>
              )}
              <Text style={styles.heading}>Service</Text>
              <Text style={styles.value}>
                {booking.serviceTypeName} · {booking.estimate.durationMinutes}{' '}
                minutes
              </Text>
              <Text style={styles.heading}>Date & Time</Text>
              <Text style={styles.value}>
                {new Date(booking.scheduledAt).toLocaleString()}
              </Text>
              <Text style={styles.heading}>Location</Text>
              <Text style={styles.value}>
                {booking.serviceAddress.formattedAddress}
              </Text>
              <Text style={styles.heading}>Payment Summary</Text>
              <View style={styles.row}>
                <Text style={styles.value}>Total Amount</Text>
                <Text style={styles.total}>{bookingAmount(booking)}</Text>
              </View>
              <Text style={styles.muted}>
                Cash on Services ·{' '}
                {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </Text>
              {!!booking.notes && (
                <>
                  <Text style={styles.heading}>Customer Note</Text>
                  <Text style={styles.value}>{booking.notes}</Text>
                </>
              )}
              {!!booking.cancellationReason && (
                <>
                  <Text style={styles.heading}>Cancellation reason</Text>
                  <Text style={styles.value}>{booking.cancellationReason}</Text>
                </>
              )}
              <View style={styles.actions}>
                <BookingActions booking={booking} />
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 112 },
  card: {
    borderWidth: 1,
    borderColor: '#DFEEE7',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  reference: { fontWeight: '700', fontSize: 18, color: '#1D3C30' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBF0E6',
    color: '#1D6756',
    fontSize: 11,
    padding: 7,
    borderRadius: 6,
    marginTop: 10,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#213F31',
    marginTop: 24,
    marginBottom: 8,
  },
  value: { fontSize: 13, lineHeight: 20, color: '#52675A' },
  muted: { fontSize: 11, lineHeight: 18, color: '#849388', marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  total: { color: '#163C2C', fontWeight: '700', fontSize: 16 },
  link: { color: '#1D6756', fontSize: 13, marginTop: 7 },
  actions: { marginTop: 26 },
  back: { color: '#FFFFFF', fontSize: 32 },
  state: { padding: 20, gap: 12 },
  error: { color: '#B54136', fontSize: 12 },
});
