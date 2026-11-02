import {
  ownerBookingPresentation,
  canContactCustomer,
} from '../utils/ownerBookingPresentation';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Search,
  X,
  CalendarDays,
  Clock3,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
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
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const { items, total, loading, error, refresh, loadMore } = useDemandBookings(
    status,
    search,
    period,
  );

  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <CommonHeader
          title={period ? 'Today’s Bookings' : 'My Bookings'}
          subtitle="Manage your requests and appointments"
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
                style={[styles.tab, status === tab && styles.selected]}
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
            <View style={styles.listHeading}>
              <View style={styles.headingCopy}>
                <Text style={styles.sectionTitle}>
                  {status === 'all'
                    ? 'All bookings'
                    : `${bookingStatusLabel(status)} bookings`}
                </Text>
                <Text style={styles.muted}>
                  {period
                    ? 'Appointments and requests from today'
                    : 'Pull down to refresh your bookings'}
                </Text>
              </View>
              {!loading && !error && (
                <View style={styles.count}>
                  <Text style={styles.countText}>{total}</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const presentation = ownerBookingPresentation(item);
            const customer =
              item.customer?.name ||
              item.serviceAddress.contactName ||
              'Customer';
            const initials = customer
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map(part => part[0])
              .join('')
              .toUpperCase();
            const appointment = new Date(item.scheduledAt);
            return (
              <View style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.serviceTypeName} booking for ${customer}`}
                  onPress={() =>
                    navigation.navigate('BookingDetails', {
                      bookingId: item._id,
                    })
                  }
                >
                  <View style={styles.row}>
                    <Text style={styles.reference}>{item.bookingNumber}</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: presentation.background },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: presentation.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: presentation.color },
                        ]}
                      >
                        {presentation.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.identity}>
                    <View style={styles.avatar}>
                      <Text style={styles.initials}>{initials}</Text>
                    </View>
                    <View style={styles.identityCopy}>
                      <Text style={styles.service}>{item.serviceTypeName}</Text>
                      <Text style={styles.customer}>{customer}</Text>
                    </View>
                    <ChevronRight size={18} color="#7F958B" />
                  </View>
                  <View style={styles.appointment}>
                    <View style={styles.appointmentLine}>
                      <CalendarDays size={14} color="#60796F" />
                      <Text style={styles.date}>
                        {appointment.toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <Clock3 size={14} color="#60796F" />
                      <Text style={styles.date}>
                        {appointment.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </View>
                    {!!item.serviceAddress.formattedAddress && (
                      <View style={styles.appointmentLine}>
                        <MapPin size={14} color="#60796F" />
                        <Text numberOfLines={1} style={styles.address}>
                          {item.serviceAddress.formattedAddress}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.amount}>{bookingAmount(item)}</Text>
                    <Text style={styles.viewDetails}>View details →</Text>
                  </View>
                  {item.status === 'cancelled' && (
                    <Text style={styles.statusNote}>
                      {presentation.description}
                    </Text>
                  )}
                </Pressable>
                {canContactCustomer(item) && (
                  <View style={styles.bookingActions}>
                    <BookingActions booking={item} />
                  </View>
                )}
              </View>
            );
          }}
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
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  header: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 21, fontWeight: '700' },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E1',
    borderRadius: 14,
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#234A3A',
    fontSize: 14,
  },
  tabs: { paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  tab: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE8E2',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  selected: { borderColor: '#164C48', backgroundColor: '#164C48' },
  tabText: { fontSize: 12, color: '#698174', fontWeight: '500' },
  selectedText: { color: '#FFFFFF', fontWeight: '700' },
  list: { paddingHorizontal: 18, paddingBottom: 110, gap: 14, flexGrow: 1 },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headingCopy: { flex: 1, gap: 5 },
  sectionTitle: { color: '#224638', fontSize: 17, fontWeight: '700' },
  count: {
    backgroundColor: '#E5EEE8',
    minWidth: 32,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  countText: { color: '#315D4B', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE8E2',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reference: { color: '#7A9084', fontWeight: '600', fontSize: 10, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '65%',
  },
  badgeText: { fontSize: 10, fontWeight: '600', flexShrink: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 17,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#EDF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#315D4B', fontSize: 15, fontWeight: '700' },
  identityCopy: { flex: 1, gap: 5 },
  service: { fontWeight: '700', color: '#213D30', fontSize: 16 },
  customer: { color: '#74897C', fontSize: 12, lineHeight: 18 },
  muted: { color: '#83948A', fontSize: 11, lineHeight: 18 },
  appointment: {
    padding: 12,
    backgroundColor: '#F5F8F6',
    borderRadius: 12,
    gap: 8,
  },
  appointmentLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  date: { color: '#5D7868', fontSize: 11, flexShrink: 1 },
  address: { color: '#7D9084', fontSize: 11, flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 15,
  },
  amount: { color: '#164C48', fontWeight: '700', fontSize: 19 },
  viewDetails: { color: '#60796F', fontSize: 11, fontWeight: '600' },
  statusNote: { color: '#A2473D', fontSize: 12, lineHeight: 18, marginTop: 10 },
  bookingActions: {
    borderTopWidth: 1,
    borderTopColor: '#EDF2EE',
    paddingTop: 14,
    marginTop: 14,
  },
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
