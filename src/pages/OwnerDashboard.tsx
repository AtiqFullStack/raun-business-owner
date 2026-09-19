import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, LogOut, Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetTo } from '../navigation/navigationRef';
import { useAuth } from '../store/useAuth';
import { colors } from '../styles/theme';
import Logo from '../assets/svg/Logo.svg';

const STATS = [
  { label: "Today's\nOrder", value: '24', change: '↑ 20%' },
  { label: 'Pending\nOrders', value: '6', change: '↑ 10%' },
  { label: 'Revenue\nToday', value: 'B$ 5.50', change: '↑ 18%' },
];

const ORDERS = [
  {
    id: '#ORD1236',
    customer: 'Sara Ali',
    details: '5 Items . AED 120',
    time: '2 Min ago',
    initials: 'SA',
    tint: '#E7D1DF',
  },
  {
    id: '#ORD1236',
    customer: 'Sara Ali',
    details: '5 Items . AED 120',
    time: '2 Min ago',
    initials: 'SA',
    tint: '#FFF0C9',
  },
  {
    id: '#ORD1236',
    customer: 'Sara Ali',
    details: '5 Items . AED 120',
    time: '2 Min ago',
    initials: 'SA',
    tint: '#D6E5E8',
  },
  {
    id: '#ORD1236',
    customer: 'Sara Ali',
    details: '5 Items . AED 120',
    time: '2 Min ago',
    initials: 'SA',
    tint: '#ECD8E5',
  },
];

const BOOKINGS = [
  {
    title: 'Haircut - Sara Ali',
    time: 'Today . 10:30 AM',
    initials: 'SA',
    tint: '#E7D1DF',
  },
  {
    title: 'Haircut - Sara Ali',
    time: 'Today . 10:30 AM',
    initials: 'SA',
    tint: '#FFF0C9',
  },
  {
    title: 'Haircut - Sara Ali',
    time: 'Today . 10:30 AM',
    initials: 'SA',
    tint: '#D6E5E8',
  },
];

export default function OwnerDashboard() {
  const insets = useSafeAreaInsets();
  const logout = useAuth(state => state.logout);

  const handleLogout = () => {
    logout();
    resetTo('login');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.hero, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityLabel="Open menu"
          >
            <Menu size={22} color="#FFFFFF" strokeWidth={1.8} />
          </TouchableOpacity>

          <View pointerEvents="none" style={styles.wordmark}>
            <Logo width={62} height={17} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              onPress={handleLogout}
            >
              <LogOut size={18} color="#FFFFFF" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={18} color="#FFFFFF" strokeWidth={1.8} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Hello, <Text style={styles.greetingName}>Ahemed</Text>
          </Text>
          <Text style={styles.greetingSubtitle}>
            Here’s what’s happening today
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 14) + 14 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          {STATS.map((stat, index) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text
                style={[
                  styles.statChange,
                  index === 1 && styles.statChangeOrange,
                ]}
              >
                {stat.change}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>New Orders</Text>
        <View style={styles.listCard}>
          {ORDERS.map((order, index) => (
            <View
              key={`${order.id}-${index}`}
              style={[
                styles.listRow,
                index === ORDERS.length - 1 && styles.lastRow,
              ]}
            >
              <Avatar initials={order.initials} tint={order.tint} />
              <View style={styles.rowInfo}>
                <Text style={styles.primaryText}>{order.id}</Text>
                <Text style={styles.secondaryText}>{order.customer}</Text>
                <Text style={styles.secondaryText}>{order.details}</Text>
              </View>
              <Text style={styles.timeText}>{order.time}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <View style={styles.listCard}>
          {BOOKINGS.map((booking, index) => (
            <View
              key={`${booking.title}-${index}`}
              style={[
                styles.bookingRow,
                index === BOOKINGS.length - 1 && styles.lastRow,
              ]}
            >
              <Avatar initials={booking.initials} tint={booking.tint} />
              <View style={styles.rowInfo}>
                <Text style={styles.bookingTitle}>{booking.title}</Text>
                <Text style={styles.bookingTime}>{booking.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Avatar({ initials, tint }: { initials: string; tint: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: tint }]}>
      <View style={styles.avatarHead} />
      <View style={styles.avatarBody} />
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E9E9E9' },
  hero: {
    height: 151,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 18,
  },
  topBar: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  wordmark: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: { marginTop: 5 },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  greetingName: { fontWeight: '400' },
  greetingSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    lineHeight: 15,
  },
  scrollView: { flex: 1, marginTop: -38 },
  content: { paddingHorizontal: 10 },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  statCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  statLabel: { minHeight: 24, color: '#777777', fontSize: 10, lineHeight: 12 },
  statValue: {
    marginTop: 2,
    color: '#181818',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
  },
  statChange: { marginTop: 2, color: '#0DBB69', fontSize: 9, lineHeight: 12 },
  statChangeOrange: { color: colors.secondary },
  sectionTitle: {
    marginBottom: 8,
    color: '#151515',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  listCard: {
    overflow: 'hidden',
    marginBottom: 18,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  listRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8D8D8',
  },
  bookingRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8D8D8',
  },
  lastRow: { borderBottomWidth: 0 },
  avatar: {
    width: 43,
    height: 43,
    marginRight: 10,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarHead: {
    position: 'absolute',
    top: 7,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#876C64',
  },
  avatarBody: {
    position: 'absolute',
    bottom: -7,
    width: 32,
    height: 28,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#5F4B50',
  },
  avatarInitials: {
    zIndex: 1,
    paddingBottom: 3,
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  rowInfo: { flex: 1, alignSelf: 'center' },
  primaryText: {
    color: '#161616',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  secondaryText: { color: '#383838', fontSize: 9, lineHeight: 13 },
  timeText: {
    alignSelf: 'flex-start',
    marginTop: 4,
    color: '#767676',
    fontSize: 9,
    lineHeight: 12,
  },
  bookingTitle: { color: '#303030', fontSize: 9, lineHeight: 14 },
  bookingTime: { color: '#303030', fontSize: 9, lineHeight: 14 },
});
