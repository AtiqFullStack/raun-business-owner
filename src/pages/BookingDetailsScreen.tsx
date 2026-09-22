import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, MessageSquare, Phone } from 'lucide-react-native';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../styles/theme';
import type { BookingStackParamList } from '../routes/TabNavigation';
import { bookings } from './BookingScreen';

type Props = NativeStackScreenProps<BookingStackParamList, 'BookingDetails'>;
export default function BookingDetailsScreen({ navigation, route }: Props) {
  const booking = bookings.find(item => item.id === route.params.bookingId) ?? bookings[0];
  return <View style={styles.screen}>
    <CommonHeader title="Booking Details" left={<ArrowLeft size={23} color={colors.textLight} onPress={() => navigation.goBack()} />} topPadding={12} bottomPadding={20} horizontalPadding={12} titleStyle={styles.headerTitle} containerStyle={styles.header} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.panel}>
        <View style={styles.heading}><View><Text style={styles.id}>#{booking.id}</Text><Text style={styles.subtle}>Today . 9 May 2026</Text></View><Text style={styles.badge}>New Booking</Text></View>
        <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>SA</Text></View><View style={styles.personText}><Text style={styles.name}>{booking.customer}</Text><Text style={styles.subtle}>+971 50 123 4567</Text></View><View style={styles.iconBox}><Phone size={17} color={colors.textMuted} /></View><View style={styles.iconBox}><MessageSquare size={17} color={colors.textMuted} /></View></View>
        <View style={styles.section}><View style={styles.row}><View><Text style={styles.label}>Service</Text><Text style={styles.value}>{booking.service}</Text></View><Text style={styles.subtle}>2 Hours</Text></View></View>
        <View style={styles.section}><Text style={styles.label}>Date &amp; Time</Text><View style={styles.row}><Text style={styles.value}>{booking.date}</Text><Text style={styles.subtle}>{booking.time}</Text></View></View>
        <View style={styles.section}><Text style={styles.label}>Location</Text><View style={styles.row}><Text style={styles.value}>All Barsha 1, Dubai, UAE</Text><Text style={styles.link}>View On Map</Text></View></View>
        <View style={styles.section}><Text style={styles.label}>Price Details</Text><View style={styles.priceRow}><Text style={styles.label}>Service Amount</Text><Text style={styles.label}>AED 100</Text></View><View style={styles.priceRow}><Text style={styles.label}>Tax (5%)</Text><Text style={styles.label}>AED 20</Text></View><View style={styles.priceRow}><Text style={styles.label}>Total Amount</Text><Text style={styles.total}>{booking.amount}</Text></View></View>
        <View style={styles.note}><Text style={styles.label}>Customer Note</Text><Text style={styles.value}>Please bring extra vacuum Cleaner</Text></View>
      </View>
      <View style={styles.actions}><Pressable onPress={() => navigation.goBack()} style={[styles.action, styles.decline]}><Text style={styles.declineText}>Decline</Text></Pressable><Pressable onPress={() => navigation.goBack()} style={[styles.action, styles.accept]}><Text style={styles.acceptText}>Accept</Text></Pressable></View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F7' }, header: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }, headerTitle: { fontSize: 16, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 115 }, panel: { backgroundColor: colors.surface, borderRadius: 5, overflow: 'hidden' },
  heading: { minHeight: 76, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.divider },
  id: { color: colors.textDark, fontWeight: '700', fontSize: 16 }, subtle: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  badge: { backgroundColor: '#FFE8D7', color: colors.primaryDark, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 4, fontSize: 12 },
  person: { flexDirection: 'row', alignItems: 'center', padding: 14, minHeight: 85 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.secondaryDark, fontWeight: '700' }, personText: { flex: 1, marginLeft: 12 }, name: { color: colors.textDark, fontSize: 13, fontWeight: '700' },
  iconBox: { width: 35, height: 35, borderWidth: 1, borderColor: colors.border, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  section: { paddingHorizontal: 13, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: 11 }, value: { color: colors.textDark, fontSize: 11, marginTop: 5 }, link: { color: colors.primaryDark, fontSize: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }, total: { color: colors.secondaryDark, fontSize: 11, fontWeight: '700' },
  note: { padding: 13, minHeight: 76 }, actions: { flexDirection: 'row', gap: 14, marginTop: 14 }, action: { flex: 1, height: 35, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  decline: { borderWidth: 1, borderColor: colors.secondary }, accept: { backgroundColor: colors.secondaryDark }, declineText: { color: colors.primaryDark, fontSize: 12 }, acceptText: { color: colors.textLight, fontSize: 12 },
});
