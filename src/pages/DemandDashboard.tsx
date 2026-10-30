import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  Menu,
  Wallet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../routes/TabNavigation';
import KeyboardWrapper from '../components/KeyboardWrapper';
import BookingActions from '../components/demand/BookingActions';
import useDemandDashboard from '../hooks/useDemandDashboard';
import { useAuth } from '../store/useAuth';
import { resetTo } from '../navigation/navigationRef';
import Logo from '../assets/svg/Logo.svg';
import {
  bookingAmount,
  bookingStatusLabel,
  type BookingStatus,
  type DemandBooking,
} from '../services/demandBookingService';

const statusColors = {
  pending: { color: '#B65B16', backgroundColor: '#FFF1E6' },
  confirmed: { color: '#176558', backgroundColor: '#E7F3EE' },
  in_progress: { color: '#316787', backgroundColor: '#EAF3FA' },
  completed: { color: '#24704C', backgroundColor: '#E8F5EB' },
  cancelled: { color: '#A04B4B', backgroundColor: '#FAEEEE' },
};

export default function DemandDashboard() {
  const { data, loading, error, refresh } = useDemandDashboard();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const fallbackName = useAuth(state => state.user?.name);
  const [period, setPeriod] = useState<'today' | 'upcoming'>('today');
  const name = (data?.profile.name || fallbackName || '')
    .trim()
    .split(/\s+/)[0];
  const metrics = data?.metrics;
  const revenue = metrics
    ? metrics.revenueToday.length
      ? metrics.revenueToday
          .map(item => `${item.currency} ${item.amount.toFixed(2)}`)
          .join('\n')
      : `${data!.profile.currency} 0.00`
    : '—';
  const today = period === 'today';
  const bookings = (today ? data?.today : data?.upcoming) || [];
  const openBookings = (
    status: BookingStatus | 'all' = 'all',
    onlyToday = false,
  ) =>
    navigation.navigate('MyBookings', {
      screen: 'Booking',
      params: { status, period: onlyToday ? 'today' : undefined },
    });
  const menu = () =>
    Alert.alert('Account', undefined, [
      { text: 'My profile', onPress: () => navigation.navigate('Account') },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          useAuth.getState().logout();
          resetTo('login');
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);

  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open account menu"
              onPress={menu}
              style={styles.headerButton}
            >
              <Menu color="#FFFFFF" size={21} strokeWidth={1.7} />
            </Pressable>
            <Logo width={76} height={28} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={() => navigation.navigate('Notification')}
              style={styles.headerButton}
            >
              <Bell color="#FFFFFF" size={20} strokeWidth={1.7} />
            </Pressable>
          </View>
          <View style={styles.greetingRow}>
            <View style={styles.greetingCopy}>
              <Text style={styles.eyebrow}>YOUR WORKDAY, AT A GLANCE</Text>
              <Text style={styles.greeting}>
                Hello{name ? `, ${name}` : ''}
              </Text>
            </View>
            <View style={styles.dateChip}>
              <CalendarDays size={13} color="#C9DEDA" />
              <Text style={styles.dateChipText}>
                {new Date().toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && !!data}
              onRefresh={refresh}
              tintColor="#164C48"
              colors={['#164C48']}
            />
          }
        >
          <View style={styles.body}>
            <View style={styles.revenueCard}>
              <View style={styles.revenueTop}>
                <View style={styles.revenueCopy}>
                  <Text style={styles.revenueLabel}>Revenue Today</Text>
                  <Text style={styles.revenueValue}>{revenue}</Text>
                  <Text style={styles.revenueHint}>Paid services</Text>
                </View>
                <View style={styles.walletIcon}>
                  <Wallet size={23} color="#164C48" strokeWidth={1.6} />
                </View>
              </View>
              <View style={styles.workdayStats}>
                {[
                  {
                    label: 'New Booking',
                    value: metrics?.newBookings,
                    status: 'all' as const,
                    onlyToday: true,
                  },
                  {
                    label: 'Pending',
                    value: metrics?.pending,
                    status: 'pending' as const,
                    onlyToday: false,
                  },
                ].map((item, index) => (
                  <Pressable
                    key={item.label}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${item.label.toLowerCase()}`}
                    onPress={() => openBookings(item.status, item.onlyToday)}
                    style={[
                      styles.workdayStat,
                      index > 0 && styles.statDivider,
                    ]}
                  >
                    <View style={styles.workdayStatCopy}>
                      <Text style={styles.workdayLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.workdayValue,
                          index === 1 && styles.pendingValue,
                        ]}
                      >
                        {item.value ?? '—'}
                      </Text>
                    </View>
                    <ArrowUpRight
                      size={17}
                      color={index === 1 ? '#D77936' : '#77918B'}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.overviewHeader}>
              <Text style={styles.overviewLabel}>Overview</Text>
              <Text style={styles.overviewPeriod}>All time</Text>
            </View>
            <View style={styles.overview}>
              {[
                {
                  label: 'Bookings',
                  value: metrics?.bookings,
                  status: 'all' as const,
                },
                {
                  label: 'Completed',
                  value: metrics?.completed,
                  status: 'completed' as const,
                },
                {
                  label: 'Cancelled',
                  value: metrics?.cancelled,
                  status: 'cancelled' as const,
                },
              ].map((item, index) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.label.toLowerCase()}`}
                  onPress={() => openBookings(item.status)}
                  style={[
                    styles.overviewStat,
                    index > 0 && styles.overviewDivider,
                  ]}
                >
                  <Text style={styles.overviewValue}>{item.value ?? '—'}</Text>
                  <Text style={styles.overviewStatLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={refresh}
                  style={styles.retryButton}
                >
                  <Text style={styles.link}>Retry</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.sectionHeading}>
              <Text style={styles.heading}>Your bookings</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View all ${
                  today ? 'Today’s Bookings' : 'Upcoming Booking'
                }`}
                onPress={() => openBookings('all', today)}
                style={styles.viewAll}
              >
                <Text style={styles.link}>View all</Text>
                <ChevronRight color="#DB6B1D" size={15} />
              </Pressable>
            </View>
            <View accessibilityRole="tablist" style={styles.tabs}>
              {[
                {
                  key: 'today' as const,
                  label: 'Today’s Bookings',
                  count: data?.todayTotal,
                },
                {
                  key: 'upcoming' as const,
                  label: 'Upcoming Booking',
                  count: undefined,
                },
              ].map(tab => (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: period === tab.key }}
                  onPress={() => setPeriod(tab.key)}
                  style={[styles.tab, period === tab.key && styles.selectedTab]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      period === tab.key && styles.selectedTabLabel,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && (
                    <Text
                      style={[
                        styles.tabCount,
                        period === tab.key && styles.selectedCount,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionHint}>
              {today
                ? 'Received or scheduled today'
                : 'Your next scheduled services'}
            </Text>

            <View style={styles.bookingList}>
              {bookings.map(booking => (
                <BookingPreview
                  key={booking._id}
                  booking={booking}
                  onPress={() =>
                    navigation.navigate('MyBookings', {
                      screen: 'BookingDetails',
                      params: { bookingId: booking._id },
                    })
                  }
                />
              ))}
              {loading && !data ? (
                <ActivityIndicator color="#164C48" style={styles.loading} />
              ) : data && !bookings.length ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <CalendarCheck2
                      size={27}
                      color="#547D73"
                      strokeWidth={1.4}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {today ? 'No bookings today' : 'No upcoming bookings'}
                  </Text>
                  <Text style={styles.emptyCopy}>
                    {today
                      ? 'New requests and today’s services will appear here.'
                      : 'Your future service requests will appear here.'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openBookings()}
                    style={styles.browseButton}
                  >
                    <Text style={styles.browseLabel}>Browse all bookings</Text>
                    <ChevronRight color="#164C48" size={15} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardWrapper>
  );
}

function BookingPreview({
  booking,
  onPress,
}: {
  booking: DemandBooking;
  onPress: () => void;
}) {
  const customer =
    booking.customer?.name || booking.serviceAddress.contactName || 'Customer';
  const initials = customer
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const date = new Date(booking.scheduledAt);
  return (
    <View style={styles.bookingCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${booking.serviceTypeName} booking for ${customer}`}
        onPress={onPress}
      >
        <View style={styles.bookingTop}>
          <Text numberOfLines={1} style={styles.bookingReference}>
            {booking.bookingNumber || 'Service booking'}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: statusColors[booking.status].backgroundColor },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[booking.status].color },
              ]}
            />
            <Text
              style={[
                styles.badgeLabel,
                { color: statusColors[booking.status].color },
              ]}
            >
              {bookingStatusLabel(booking.status)}
            </Text>
          </View>
        </View>
        <View style={styles.bookingIdentity}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.bookingCopy}>
            <Text style={styles.service}>{booking.serviceTypeName}</Text>
            <Text numberOfLines={1} style={styles.customer}>
              {customer}
            </Text>
          </View>
          <ChevronRight size={18} color="#8A9C96" />
        </View>
        <View style={styles.appointment}>
          <View style={styles.appointmentCopy}>
            <View style={styles.appointmentLine}>
              <CalendarDays size={13} color="#5C756D" />
              <Text style={styles.appointmentText}>
                {date.toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <View style={styles.appointmentDot} />
              <Clock3 size={13} color="#5C756D" />
              <Text style={styles.appointmentText}>
                {date.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            {!!booking.serviceAddress.formattedAddress && (
              <Text numberOfLines={1} style={styles.address}>
                {booking.serviceAddress.formattedAddress}
              </Text>
            )}
          </View>
          <Text style={styles.amount}>{bookingAmount(booking)}</Text>
        </View>
      </Pressable>
      {booking.status === 'pending' && (
        <View style={styles.bookingActions}>
          <BookingActions booking={booking} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  scroll: { flex: 1 },
  content: { paddingTop: 14, paddingBottom: 104 },
  hero: {
    backgroundColor: '#164C48',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF0D',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetingCopy: { flex: 1 },
  eyebrow: {
    color: '#B2CFCA',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF0D',
  },
  dateChipText: { color: '#DCEAE7', fontSize: 11, fontWeight: '500' },
  body: { paddingHorizontal: 18 },
  revenueCard: {
    marginTop: 0,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingTop: 14,
    borderWidth: 1,
    borderColor: '#E3EBE7',
    shadowColor: '#173D32',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  revenueTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  revenueCopy: { flex: 1 },
  revenueLabel: { color: '#61766D', fontSize: 12, fontWeight: '500' },
  revenueValue: {
    color: '#173D32',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  revenueHint: { color: '#8A9992', fontSize: 10, marginTop: 4 },
  walletIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: '#EFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workdayStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#EDF1EF',
    paddingVertical: 10,
  },
  workdayStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingRight: 14,
    minHeight: 44,
  },
  workdayStatCopy: { flex: 1, gap: 5 },
  statDivider: {
    borderLeftWidth: 1,
    borderColor: '#E7EEEA',
    paddingLeft: 18,
    paddingRight: 0,
  },
  workdayLabel: { color: '#6C7B74', fontSize: 11 },
  workdayValue: { color: '#173D32', fontSize: 21, fontWeight: '700' },
  pendingValue: { color: '#D16B21' },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 9,
  },
  overviewLabel: { color: '#60736A', fontSize: 11, fontWeight: '600' },
  overviewPeriod: { color: '#8B9992', fontSize: 10 },
  overview: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6ECE8',
    paddingVertical: 10,
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    minHeight: 44,
    gap: 5,
  },
  overviewDivider: { borderLeftWidth: 1, borderColor: '#EDF1EF' },
  overviewValue: { color: '#274B3D', fontSize: 20, fontWeight: '700' },
  overviewStatLabel: { color: '#7A8881', fontSize: 10 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    color: '#203F33',
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 32,
  },
  link: { color: '#DB6B1D', fontSize: 12, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E9EFEB',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 42,
    borderRadius: 9,
  },
  selectedTab: { backgroundColor: '#FFFFFF' },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7A8A81',
    flexShrink: 1,
  },
  selectedTabLabel: { color: '#164C48', fontWeight: '700' },
  tabCount: {
    fontSize: 10,
    color: '#6B7C73',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#DBE5DE',
  },
  selectedCount: { color: '#164C48', backgroundColor: '#EAF3EC' },
  sectionHint: {
    color: '#84928A',
    fontSize: 10,
    marginTop: 11,
    marginBottom: 12,
  },
  bookingList: { gap: 12 },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3EBE6',
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  bookingReference: {
    flex: 1,
    color: '#829087',
    fontSize: 10,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  badgeLabel: { fontSize: 10, fontWeight: '600' },
  bookingIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#4A7261', fontSize: 14, fontWeight: '600' },
  bookingCopy: { flex: 1, gap: 5 },
  service: { color: '#203F33', fontWeight: '700', fontSize: 15 },
  customer: { color: '#7E8A83', fontSize: 12 },
  appointment: {
    backgroundColor: '#F5F8F5',
    borderRadius: 9,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  appointmentCopy: { flex: 1, minWidth: 145, gap: 5 },
  appointmentLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },
  appointmentText: { color: '#526B5E', fontSize: 10, fontWeight: '500' },
  appointmentDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#A3B2A8',
    marginHorizontal: 2,
  },
  address: { color: '#8A988E', fontSize: 10 },
  amount: { color: '#264E3B', fontSize: 12, fontWeight: '700' },
  bookingActions: { marginTop: 13 },
  loading: { padding: 36 },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5E2D8',
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#375443',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCopy: {
    color: '#859187',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 240,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDE8E0',
    marginTop: 18,
    minHeight: 44,
  },
  browseLabel: { color: '#164C48', fontSize: 11, fontWeight: '600' },
  errorBox: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#FFF0E8',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  error: { color: '#A15030', fontSize: 12, lineHeight: 18, flex: 1 },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
