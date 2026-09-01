import { StyleSheet, Text, View, FlatList, Image, Dimensions } from 'react-native';
import React from 'react';
import { colors } from '../../styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

const DUMMY_DATA = [
  { id: '1', name: "Jame'Asr Hassanil Bolkiah Mosque", distance: '46 km from city center', image: 'https://picsum.photos/seed/mosque1/320/220' },
  { id: '2', name: 'Sultan Omar Ali Saifuddin Mosque', distance: '46 km from city center', image: 'https://picsum.photos/seed/mosque2/320/220' },
  { id: '3', name: 'Royal Regalia Museum', distance: '46 km from city center', image: 'https://picsum.photos/seed/museum1/320/220' },
  { id: '4', name: 'Bandar Seri Begawan Waterfront', distance: '46 km from city center', image: 'https://picsum.photos/seed/water1/320/220' },
  { id: '5', name: 'Istana Nurul Iman', distance: '46 km from city center', image: 'https://picsum.photos/seed/palace1/320/220' },
  { id: '6', name: 'Kampong Ayer', distance: '46 km from city center', image: 'https://picsum.photos/seed/village1/320/220' },
  { id: '7', name: 'Tasek Lama Recreational Park', distance: '46 km from city center', image: 'https://picsum.photos/seed/park1/320/220' },
  { id: '8', name: 'Brunei Museum', distance: '46 km from city center', image: 'https://picsum.photos/seed/museum2/320/220' },
];

const LocationIcon = () => (
  <View style={styles.locationIconCircle}>
    <View style={styles.locationIconDot} />
  </View>
);

const PlaceCard = ({ item }: { item: typeof DUMMY_DATA[0] }) => (
  <View style={styles.card}>
    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      <View style={styles.distanceRow}>
        <LocationIcon />
        <Text style={styles.distanceText}>{item.distance}</Text>
      </View>
    </View>
  </View>
);

export default function ListingView() {
  return (
    <FlatList
      data={DUMMY_DATA}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <PlaceCard item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 10,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 110,
  },
  cardBody: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 16,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  distanceText: {
    fontSize: 10,
    color: '#888',
  },
});
