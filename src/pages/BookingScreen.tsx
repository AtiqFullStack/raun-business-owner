import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Search } from 'lucide-react-native';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../styles/theme';
import type { BookingStackParamList } from '../routes/TabNavigation';

const tabs = ['New', 'Accepted', 'Ongoing', 'Completed'] as const;
type Status = typeof tabs[number];
export const bookings = [
  { id: 'BK12345', customer: 'Sara Ali', service: 'Deep Cleaning', date: '9 May 2026', time: '10:30 AM - 12:30 PM', amount: 'AED 120.00' },
  { id: 'BK12346', customer: 'Sara Ali', service: 'Deep Cleaning', date: '9 May 2026', time: '10:30 AM - 12:30 PM', amount: 'AED 120.00' },
  { id: 'BK12347', customer: 'Sara Ali', service: 'Deep Cleaning', date: '9 May 2026', time: '10:30 AM - 12:30 PM', amount: 'AED 120.00' },
  { id: 'BK12348', customer: 'Sara Ali', service: 'Deep Cleaning', date: '9 May 2026', time: '10:30 AM - 12:30 PM', amount: 'AED 120.00' },
];
type Props = NativeStackScreenProps<BookingStackParamList, 'Booking'>;
export default function BookingScreen({ navigation }: Props) {
  const [status, setStatus] = useState<Status>('New');
  const [bookingStatuses, setBookingStatuses] = useState<Record<string, Status | 'Declined'>>({});
  const visible = bookings.filter(booking => (bookingStatuses[booking.id] ?? 'New') === status);
  const updateStatus = (id: string, next: Status | 'Declined') => setBookingStatuses(current => ({ ...current, [id]: next }));
  return <View style={styles.screen}>
    <CommonHeader title="Booking" left={<ArrowLeft color={colors.textLight} size={22} onPress={() => navigation.goBack()} />} right={<Search color={colors.textLight} size={20} />} topPadding={12} bottomPadding={16} horizontalPadding={12} titleStyle={styles.headerTitle} rowStyle={styles.headerRow} />
    <View style={styles.tabs}>{tabs.map(tab => <Pressable key={tab} onPress={() => setStatus(tab)} style={[styles.tab, status === tab && styles.activeTab]}><Text style={styles.tabText}>{tab}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={styles.dateHeading}>Today . 3 May 2026</Text>
      {visible.map(booking => <Pressable key={booking.id} onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })} style={styles.card}>
        <View style={styles.cardTop}><Text style={styles.id}>#{booking.id}</Text><Text style={styles.badge}>{status === 'New' ? 'New' : status}</Text></View>
        <Text style={styles.service}>{booking.service}</Text><Text style={styles.customer}>{booking.customer}</Text>
        <View style={styles.timeRow}><Text style={styles.time}>{booking.time}</Text><Text style={styles.amount}>{booking.amount}</Text></View>
        {status === 'New' && <View style={styles.actions}><Pressable onPress={() => updateStatus(booking.id, 'Declined')} style={[styles.action, styles.decline]}><Text style={styles.declineText}>Decline</Text></Pressable><Pressable onPress={() => updateStatus(booking.id, 'Accepted')} style={[styles.action, styles.accept]}><Text style={styles.acceptText}>Accept</Text></Pressable></View>}
      </Pressable>)}
      {visible.length === 0 && <Text style={styles.empty}>No {status.toLowerCase()} bookings</Text>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F7' }, headerTitle: { fontSize: 16, fontWeight: '700' }, headerRow: { minHeight: 34 },
  tabs: { flexDirection: 'row', height: 42, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' }, activeTab: { borderBottomWidth: 2, borderBottomColor: colors.secondaryDark },
  tabText: { fontSize: 12, color: colors.textDark }, list: { paddingHorizontal: 12, paddingTop: 23, paddingBottom: 110 },
  dateHeading: { color: colors.textDark, fontSize: 12, marginBottom: 10 }, card: { backgroundColor: colors.surface, borderRadius: 5, padding: 12, marginBottom: 9 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, id: { color: colors.textDark, fontSize: 10, fontWeight: '700' },
  badge: { backgroundColor: '#FFE8D7', color: colors.primaryDark, fontSize: 12, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4 },
  service: { color: colors.textDark, fontSize: 13, fontWeight: '700', marginTop: -2 }, customer: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }, time: { color: colors.textMuted, fontSize: 9 }, amount: { color: colors.textDark, fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 }, action: { flex: 1, height: 34, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  decline: { borderWidth: 1, borderColor: colors.secondary }, accept: { backgroundColor: colors.secondaryDark }, declineText: { color: colors.primaryDark, fontSize: 12 }, acceptText: { color: colors.textLight, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
});
