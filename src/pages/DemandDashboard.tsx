import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../routes/TabNavigation';
import CommonHeader from '../components/CommonHeader';
import KeyboardWrapper from '../components/KeyboardWrapper';
import useDemandBookings from '../hooks/useDemandBookings';
import { bookingAmount } from '../services/demandBookingService';
import { useAuth } from '../store/useAuth';
import BookingActions from '../components/demand/BookingActions';
export default function DemandDashboard() {
  const { items, total, loading, error, refresh, loadMore } =
    useDemandBookings('pending');
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const name = useAuth(state => state.user?.name || state.user?.email);
  return (
    <KeyboardWrapper>
      <CommonHeader title="Service Dashboard" />
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.content}
        refreshing={loading && !!items.length}
        onRefresh={refresh}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.summary}>
              <Text style={styles.count}>{total}</Text>
              <Text style={styles.muted}>Pending requests</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.heading}>New Requests</Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('MyBookings', { screen: 'Booking' })
                }
              >
                <Text style={styles.link}>View all bookings</Text>
              </Pressable>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              onPress={() =>
                navigation.navigate('MyBookings', {
                  screen: 'BookingDetails',
                  params: { bookingId: item._id },
                })
              }
            >
              <Text style={styles.heading}>{item.serviceTypeName}</Text>
              <Text style={styles.muted}>
                {item.serviceAddress.contactName || 'Customer'} ·{' '}
                {item.bookingNumber}
              </Text>
              <Text style={styles.date}>
                {new Date(item.scheduledAt).toLocaleString()}
              </Text>
              <Text style={styles.amount}>{bookingAmount(item)}</Text>
            </Pressable>
            <BookingActions booking={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#164C48" />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.muted}>
                {error ? 'Unable to load requests.' : 'No pending requests'}
              </Text>
              <Pressable onPress={refresh}>
                <Text style={styles.link}>Refresh</Text>
              </Pressable>
            </View>
          )
        }
      />
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110, gap: 12 },
  header: { gap: 18 },
  name: { color: '#214335', fontSize: 16, fontWeight: '600' },
  summary: {
    borderRadius: 12,
    backgroundColor: '#E1F3E9',
    padding: 18,
    gap: 8,
  },
  count: { color: '#164C48', fontSize: 30, fontWeight: '700' },
  muted: { color: '#849187', fontSize: 12, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heading: { color: '#203D30', fontWeight: '700', fontSize: 15 },
  link: { color: '#E97520', fontSize: 12, fontWeight: '600' },
  error: { color: '#B54136', fontSize: 12 },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0ECE5',
    borderRadius: 8,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  date: { fontSize: 12, color: '#667C6D', marginTop: 10 },
  amount: { color: '#164C48', fontWeight: '700', fontSize: 14, marginTop: 10 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 15 },
});
