import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, X } from 'lucide-react-native';
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
export default function BookingScreen({ navigation, route }: Props) {
  const ownerType = useAuth(state => state.ownerType);
  const [status, setStatus] = useState<BookingStatus | 'all'>(
    route.params?.status || 'pending',
  );
  useFocusEffect(
    useCallback(() => {
      if (route.params?.status) setStatus(route.params.status);
    }, [route.params?.status]),
  );
  // Keep restaurant/business functionality separate from service-provider requests.
  if (ownerType !== 'SERVICE_PROVIDER')
    return (
      <KeyboardWrapper dismissOnTap={false}>
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
      period={route.params?.period}
    />
  );
}
function DemandBookings({
  status,
  setStatus,
  navigation,
  period,
}: {
  status: BookingStatus | 'all';
  setStatus: (status: BookingStatus | 'all') => void;
  period?: 'today';
  navigation: Props['navigation'];
}) {
  const tabWidth = (useWindowDimensions().width - 10) / 4;
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const { items, loading, error, refresh, loadMore } = useDemandBookings(
    status,
    search,
    period,
  );

  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <CommonHeader
          title={period ? 'Today’s Bookings' : 'Booking'}
          backgroundColor="#164C48"
          containerStyle={styles.header}
          titleStyle={styles.headerTitle}
          horizontalPadding={16}
          topPadding={14}
          bottomPadding={20}
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.getParent()?.navigate('Home')}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
          }
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search bookings"
              onPress={() => {
                setSearchOpen(value => !value);
                setQuery('');
              }}
            >
              {searchOpen ? (
                <X size={20} color="#FFFFFF" />
              ) : (
                <Search size={20} color="#FFFFFF" />
              )}
            </Pressable>
          }
        />
        {searchOpen && (
          <TextInput
            accessibilityLabel="Search bookings"
            autoFocus
            maxLength={100}
            placeholder="Search name, service or booking"
            placeholderTextColor="#999999"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
        )}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {(['all', ...tabs] as const).map(tab => (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === status }}
                onPress={() => setStatus(tab)}
                style={[
                  styles.tab,
                  { width: tabWidth },
                  status === tab && styles.selected,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    status === tab && styles.selectedText,
                  ]}
                >
                  {tab === 'all' ? 'All' : bookingStatusLabel(tab)}
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.dateHeading}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          }
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
                  {item.customer?.name ||
                    item.serviceAddress.contactName ||
                    'Customer'}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.date}>
                    {new Date(item.scheduledAt).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
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
                {query
                  ? 'No matching bookings'
                  : status === 'all'
                  ? 'No bookings'
                  : `No ${bookingStatusLabel(status).toLowerCase()} bookings`}
              </Text>
            ) : null
          }
          ListFooterComponent={
            loading && items.length ? (
              <ActivityIndicator color="#164C48" />
            ) : null
          }
        />
      </View>
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAEAEA' },
  header: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#333333',
    fontSize: 12,
  },
  dateHeading: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  tabs: {
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#EAEAEA',
    flexGrow: 1,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: '#164C48' },
  tabText: { fontSize: 11, color: '#333333' },
  selectedText: { color: '#164C48', fontWeight: '700' },
  list: { padding: 12, paddingTop: 18, paddingBottom: 110, gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 12,
    gap: 10,
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
    color: '#ED741D',
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
  },
  service: {
    fontWeight: '700',
    color: '#213D30',
    fontSize: 13,
    marginBottom: 4,
  },
  muted: { color: '#8A8A8A', fontSize: 10, marginBottom: 7 },
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
