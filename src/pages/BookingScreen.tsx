import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import KeyboardWrapper from '../components/KeyboardWrapper';
import type { BookingStackParamList } from '../routes/TabNavigation';
import useDemandBookings from '../hooks/useDemandBookings';
import {
  bookingAmount,
  bookingStatusLabel,
  type BookingStatus,
} from '../services/demandBookingService';
import BookingActions from '../components/demand/BookingActions';
import { useAuth } from '../store/useAuth';
const tabs: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];
type Props = NativeStackScreenProps<BookingStackParamList, 'Booking'>;
export default function BookingScreen({ navigation }: Props) {
  const ownerType = useAuth(state => state.ownerType);
  const [status, setStatus] = useState<BookingStatus>('pending');
  // Keep restaurant/business functionality separate from service-provider requests.
  if (ownerType !== 'SERVICE_PROVIDER')
    return (
      <KeyboardWrapper>
        <CommonHeader title="Bookings" />
        <View style={styles.state}>
          <Text style={styles.muted}>
            Service bookings are available for service providers.
          </Text>
        </View>
      </KeyboardWrapper>
    );
  return (
    <DemandBookings
      status={status}
      setStatus={setStatus}
      navigation={navigation}
    />
  );
}
function DemandBookings({
  status,
  setStatus,
  navigation,
}: {
  status: BookingStatus;
  setStatus: (status: BookingStatus) => void;
  navigation: Props['navigation'];
}) {
  const { items, loading, error, refresh, loadMore } =
    useDemandBookings(status);
  return (
    <KeyboardWrapper>
      <CommonHeader title="My Bookings" />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map(tab => (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === status }}
              onPress={() => setStatus(tab)}
              style={[styles.tab, status === tab && styles.selected]}
            >
              <Text
                style={[styles.tabText, status === tab && styles.selectedText]}
              >
                {bookingStatusLabel(tab)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {!!error && (
        <View style={styles.state}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.link}>Retry</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading && !!items.length}
        onRefresh={refresh}
        onEndReached={loadMore}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('BookingDetails', { bookingId: item._id })
              }
            >
              <View style={styles.row}>
                <Text style={styles.reference}>{item.bookingNumber}</Text>
                <Text style={styles.badge}>
                  {bookingStatusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.service}>{item.serviceTypeName}</Text>
              <Text style={styles.muted}>
                {item.serviceAddress.contactName || 'Customer'}
              </Text>
              <View style={styles.row}>
                <Text style={styles.date}>
                  {new Date(item.scheduledAt).toLocaleString()}
                </Text>
                <Text style={styles.amount}>{bookingAmount(item)}</Text>
              </View>
            </Pressable>
            <BookingActions booking={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#164C48" style={styles.state} />
          ) : !error ? (
            <Text style={styles.empty}>
              No {bookingStatusLabel(status).toLowerCase()} bookings
            </Text>
          ) : null
        }
        ListFooterComponent={
          loading && items.length ? <ActivityIndicator color="#164C48" /> : null
        }
      />
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  tabs: { paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E5EDE8' },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: '#FF6B0A' },
  tabText: { fontSize: 12, color: '#6D7C74' },
  selectedText: { color: '#E76B16', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 110, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0ECE5',
    borderRadius: 8,
    padding: 14,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  reference: { color: '#253D33', fontWeight: '700', fontSize: 11 },
  badge: {
    color: '#1B5F53',
    backgroundColor: '#DEF1E8',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 10,
  },
  service: {
    fontWeight: '700',
    color: '#213D30',
    fontSize: 15,
    marginBottom: 6,
  },
  muted: { color: '#829087', fontSize: 12, marginBottom: 10 },
  date: { flex: 1, color: '#7F8F84', fontSize: 11 },
  amount: { color: '#1B392C', fontWeight: '700', fontSize: 12 },
  state: { padding: 18, gap: 8 },
  error: { color: '#B54136', fontSize: 12 },
  link: { color: '#164C48', fontWeight: '700' },
  empty: {
    paddingVertical: 70,
    textAlign: 'center',
    fontSize: 14,
    color: '#829087',
  },
});
