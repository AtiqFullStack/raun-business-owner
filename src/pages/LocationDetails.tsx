import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '../styles/theme';
import { vw } from '../utils/responsive';
import Button from '../components/Button';
import InputText from '../components/InputText';
import Logo from '../assets/svg/Code/Logo';
import { navigate } from '../navigation/navigationRef';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export default function LocationDetails() {
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('');

  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerCoord, setMarkerCoord] = useState({
    latitude: 28.6139,
    longitude: 77.209,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo />
      </View>

      {/* Step Indicator */}
      <StepIndicator current={3} total={6} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.stepTitle}>Location Details</Text>
        <Text style={styles.stepSubtitle}>Where is your business located</Text>

        <InputText
          label="Address"
          placeholder="Enter complete address"
          value={address}
          onChangeText={setAddress}
          containerStyle={styles.input}
          multiline
        />
        <InputText
          label="Area / Locality"
          placeholder="Enter area or locality"
          value={area}
          onChangeText={setArea}
          containerStyle={styles.input}
        />

        <View style={styles.row}>
          <InputText
            label="City"
            placeholder="City"
            value={city}
            onChangeText={setCity}
            containerStyle={{ marginBottom: 12, flex: 1 }}
          />
          <InputText
            label="Pin Code"
            placeholder="Pin Code"
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            containerStyle={{ marginBottom: 12, flex: 1 }}
          />
        </View>

        <InputText
          label="State"
          placeholder="State"
          value={state}
          onChangeText={setState}
          containerStyle={styles.input}
        />

        {/* Map */}
        <Text style={styles.fieldLabel}>Pin your Location</Text>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            region={region}
            onRegionChangeComplete={(r) => {
              setRegion(r);
              setMarkerCoord({ latitude: r.latitude, longitude: r.longitude });
            }}
          >
            <Marker
              coordinate={markerCoord}
              draggable
              onDragEnd={(e) =>
                setMarkerCoord(e.nativeEvent.coordinate)
              }
              pinColor={colors.secondary}
            />
          </MapView>
          <View style={styles.mapOverlayBadge}>
            <Text style={styles.mapOverlayText}>Drag to adjust</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigate('BusinessHours')}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i < current ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screen },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
  },
  scroll: { paddingHorizontal: vw(5), paddingBottom: 120, paddingTop: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.screen,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: { backgroundColor: colors.primary, width: '100%' },
  stepTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },
  input: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  mapContainer: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 20,
  },
  map: { flex: 1 },
  mapOverlayBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mapOverlayText: { color: '#fff', fontSize: 12 },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: colors.screen,
  },
  stepDot: { height: 8, borderRadius: 4 },
  stepDotActive: { width: 24, backgroundColor: colors.primary },
  stepDotInactive: { width: 8, backgroundColor: colors.border },
});
