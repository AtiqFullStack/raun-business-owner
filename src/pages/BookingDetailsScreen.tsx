import { formatMoney } from '../utils/currency';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  DeviceEventEmitter,
  Linking,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Clock3,
  MapPin,
  MessageSquare,
  Phone,
  StickyNote,
  Wrench,
} from 'lucide-react-native';
import getImageUrl from '../utils/urlConvertor';
import { useToast } from '../store/useToast';
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
  const customerName =
    booking?.customer?.name ||
    booking?.serviceAddress.contactName ||
    'Customer';
  const phone =
    booking?.customer?.phoneNumber || booking?.serviceAddress.phoneNumber;
  const photo = getImageUrl(booking?.customer?.profilePhoto);
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [photo]);
  const open = (url: string) =>
    Linking.openURL(url).catch(() =>
      useToast.getState().showToast('Unable to open this app.', 'error'),
    );
  const time = booking ? new Date(booking.scheduledAt) : null;
  const hourly =
    booking?.estimate.hourlyRate ?? booking?.estimate.totalAmount ?? 0;
  const callCharge = booking?.estimate.serviceCallCharge || 0;
  const minimumAdjustment = booking
    ? Math.max(
        0,
        booking.estimate.totalAmount -
          hourly -
          callCharge -
          (booking.estimate.taxAmount || 0),
      )
    : 0;
  const formatTime = (value: Date) =>
    value.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  const timeWindow =
    time && booking
      ? `${formatTime(time)} – ${formatTime(
          new Date(time.getTime() + booking.estimate.durationMinutes * 60000),
        )}`
      : '';
  const money = (value: number) =>
    formatMoney(value, booking?.estimate.currency);
  const canAct =
    booking && ['pending', 'confirmed', 'in_progress'].includes(booking.status);
  const statusColor =
    booking?.status === 'pending'
      ? '#B65B16'
      : booking?.status === 'cancelled'
      ? '#A04B4B'
      : '#2B7557';
  const statusBackground =
    booking?.status === 'pending'
      ? '#FFF1E6'
      : booking?.status === 'cancelled'
      ? '#FAEEEE'
      : '#E8F4EC';
  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <CommonHeader
          title="Booking Details"
          backgroundColor="#164C48"
          containerStyle={styles.header}
          horizontalPadding={18}
          topPadding={10}
          bottomPadding={16}
          titleStyle={styles.headerTitle}
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.back}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
          }
        />
        {loading && !booking ? (
          <ActivityIndicator color="#164C48" style={styles.state} />
        ) : (
          <ScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              canAct && styles.contentWithActions,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading && !!booking}
                onRefresh={refresh}
                colors={['#164C48']}
              />
            }
          >
            {!!error && (
              <View style={styles.errorBox}>
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={refresh}
                  style={styles.retry}
                >
                  <Text style={styles.link}>Retry</Text>
                </Pressable>
              </View>
            )}
            {booking && (
              <>
                <View style={styles.summary}>
                  <View style={styles.summaryTop}>
                    <Text style={styles.reference}>
                      {booking.bookingNumber}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: statusBackground },
                      ]}
                    >
                      <View
                        style={[styles.dot, { backgroundColor: statusColor }]}
                      />
                      <Text style={[styles.badgeText, { color: statusColor }]}>
                        {booking.status === 'pending'
                          ? 'New Booking'
                          : bookingStatusLabel(booking.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.serviceTitle}>
                    {booking.serviceTypeName}
                  </Text>
                  <View style={styles.duration}>
                    <Wrench size={13} color="#78907D" />
                    <Text style={styles.durationText}>
                      {booking.estimate.durationMinutes >= 60
                        ? `${booking.estimate.durationMinutes / 60} hour${
                            booking.estimate.durationMinutes === 60 ? '' : 's'
                          }`
                        : `${booking.estimate.durationMinutes} minutes`}{' '}
                      service
                    </Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Customer</Text>
                  <View style={styles.person}>
                    <View style={styles.avatar}>
                      <Text style={styles.initials}>
                        {customerName
                          .trim()
                          .split(/\s+/)
                          .map(word => word[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </Text>
                      {photo && !photoFailed && (
                        <Image
                          source={{ uri: photo }}
                          style={styles.photo}
                          onError={() => setPhotoFailed(true)}
                        />
                      )}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.customer}>{customerName}</Text>
                      {!!phone && <Text style={styles.subtle}>{phone}</Text>}
                    </View>
                  </View>
                  {!!phone && (
                    <View style={styles.contactActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Call customer"
                        onPress={() => open(`tel:${phone}`)}
                        style={styles.contactButton}
                      >
                        <Phone size={16} color="#426C50" />
                        <Text style={styles.contactLabel}>Call customer</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Message customer"
                        onPress={() => open(`sms:${phone}`)}
                        style={styles.contactButton}
                      >
                        <MessageSquare size={16} color="#426C50" />
                        <Text style={styles.contactLabel}>Message</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeading}>
                    <CalendarDays size={17} color="#5B7A61" />
                    <Text style={styles.sectionTitle}>Date & Time</Text>
                  </View>
                  <Text style={styles.scheduleDate}>
                    {time?.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.timeChip}>
                    <Clock3 size={14} color="#5B7A61" />
                    <Text style={styles.scheduleTime}>{timeWindow}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeading}>
                    <MapPin size={17} color="#5B7A61" />
                    <Text style={styles.sectionTitle}>Service location</Text>
                  </View>
                  <Text style={styles.address}>
                    {booking.serviceAddress.formattedAddress}
                  </Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => {
                      const address = booking.serviceAddress;
                      const query =
                        typeof address.latitude === 'number' &&
                        typeof address.longitude === 'number'
                          ? `${address.latitude},${address.longitude}`
                          : address.formattedAddress;
                      open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          query,
                        )}`,
                      );
                    }}
                    style={styles.mapButton}
                  >
                    <Text style={styles.mapLabel}>View On Map</Text>
                    <ArrowUpRight size={15} color="#C5773C" />
                  </Pressable>
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeading}>
                    <Banknote size={18} color="#5B7A61" />
                    <Text style={styles.sectionTitle}>Payment summary</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.label}>Service Amount</Text>
                    <Text style={styles.priceValue}>{money(hourly)}</Text>
                  </View>
                  {callCharge > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.label}>Call-out charge</Text>
                      <Text style={styles.priceValue}>{money(callCharge)}</Text>
                    </View>
                  )}
                  {minimumAdjustment > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.label}>
                        Minimum charge adjustment
                      </Text>
                      <Text style={styles.priceValue}>
                        {money(minimumAdjustment)}
                      </Text>
                    </View>
                  )}
                  {booking.estimate.taxAmount !== undefined && (
                    <View style={styles.priceRow}>
                      <Text style={styles.label}>Tax</Text>
                      <Text style={styles.priceValue}>
                        {money(booking.estimate.taxAmount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.total}>{bookingAmount(booking)}</Text>
                  </View>
                  <View style={styles.paymentMethod}>
                    <Banknote size={17} color="#6C8972" />
                    <Text style={styles.paymentLabel}>Cash on service</Text>
                    <Text
                      style={[
                        styles.paymentStatus,
                        booking.paymentStatus === 'paid' && styles.paid,
                      ]}
                    >
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>

                <View style={styles.noteCard}>
                  <View style={styles.sectionHeading}>
                    <StickyNote size={16} color="#9F835F" />
                    <Text style={styles.noteTitle}>Customer Note</Text>
                  </View>
                  <Text style={styles.noteText}>
                    {booking.notes || 'No special instructions'}
                  </Text>
                </View>
                {!!booking.cancellationReason && (
                  <View style={styles.cancellation}>
                    <Text style={styles.cancelTitle}>Cancellation reason</Text>
                    <Text style={styles.cancelText}>
                      {booking.cancellationReason}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
        {canAct && (
          <View style={styles.actions}>
            <Text style={styles.actionHint}>
              {booking.status === 'pending'
                ? 'A new request is waiting for your response'
                : booking.status === 'confirmed'
                ? 'Start when you arrive at the service location'
                : 'Mark complete once the service is finished'}
            </Text>
            <BookingActions booking={booking} />
          </View>
        )}
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  header: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 18, paddingBottom: 110, gap: 14 },
  contentWithActions: { paddingBottom: 196 },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E3EBE6',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reference: { color: '#8C9A8F', fontSize: 10, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  serviceTitle: {
    color: '#244B38',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 18,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  durationText: { color: '#78907D', fontSize: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EBE6',
    padding: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },
  sectionTitle: { color: '#345740', fontSize: 14, fontWeight: '600' },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EAF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { position: 'absolute', width: 46, height: 46 },
  initials: { color: '#52785F', fontSize: 16, fontWeight: '600' },
  flex: { flex: 1 },
  customer: { color: '#385C43', fontSize: 15, fontWeight: '600' },
  subtle: { color: '#8E9D91', fontSize: 12, marginTop: 5 },
  contactActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DFE9E0',
    backgroundColor: '#F8FAF7',
  },
  contactLabel: { color: '#426C50', fontSize: 11, fontWeight: '500' },
  scheduleDate: {
    color: '#46634A',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 21,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F1F6F0',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 11,
  },
  scheduleTime: { color: '#5B7A61', fontSize: 12 },
  address: { color: '#798B7D', fontSize: 13, lineHeight: 21 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    minHeight: 40,
    marginTop: 5,
  },
  mapLabel: { color: '#C5773C', fontSize: 12, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 8,
  },
  label: { color: '#8A998D', fontSize: 12, flex: 1, lineHeight: 19 },
  priceValue: { color: '#5D7A63', fontSize: 12 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 13,
    borderTopWidth: 1,
    borderColor: '#EDF1ED',
    paddingTop: 17,
    paddingBottom: 18,
  },
  totalLabel: { color: '#46654C', fontSize: 12, fontWeight: '500' },
  total: { color: '#244B38', fontSize: 21, fontWeight: '700' },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F8F3',
    borderRadius: 9,
    padding: 11,
  },
  paymentLabel: { color: '#7A907F', fontSize: 11, flex: 1 },
  paymentStatus: { color: '#B88A51', fontSize: 10, fontWeight: '600' },
  paid: { color: '#3B8D60' },
  noteCard: {
    backgroundColor: '#FBF7EF',
    borderWidth: 1,
    borderColor: '#EEE7D8',
    padding: 16,
    borderRadius: 14,
  },
  noteTitle: { color: '#967B57', fontSize: 13, fontWeight: '600' },
  noteText: { color: '#A18D6E', fontSize: 12, lineHeight: 20 },
  cancellation: { backgroundColor: '#FBEFEC', padding: 16, borderRadius: 14 },
  cancelTitle: {
    color: '#AF6A56',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  cancelText: { color: '#B5806F', fontSize: 12, lineHeight: 20 },
  actions: {
    position: 'absolute',
    bottom: 78,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5EDE6',
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 14,
  },
  actionHint: {
    color: '#96A396',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  state: { padding: 35 },
  errorBox: {
    backgroundColor: '#FFF1E8',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  error: { color: '#B65B37', fontSize: 12, flex: 1, lineHeight: 18 },
  retry: { minHeight: 40, justifyContent: 'center' },
  link: { color: '#C7773C', fontSize: 12, fontWeight: '600' },
});
