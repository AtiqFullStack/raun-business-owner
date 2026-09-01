import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../styles/theme';
import { vh, vw } from '../utils/responsive';
import Button from '../components/Button';
import InputText from '../components/InputText';
import Logo from '../assets/svg/Code/Logo';
import { navigate } from '../navigation/navigationRef';
import { launchImageLibrary } from 'react-native-image-picker';
import CommonHeader from '../components/CommonHeader';
import Stepper from '../components/Stepper';

const RESTAURANT_TYPES = ['Fast Food', 'Fine Dining', 'Cafe', 'Bakery', 'Dhaba', 'Street Food'];

export default function BusinessInfo() {
  const [step, setStep] = useState<1 | 2>(1);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [restaurantType, setRestaurantType] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const pickImage = async (type: 'banner' | 'logo') => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.assets && result.assets[0]?.uri) {
      if (type === 'banner') setBannerUri(result.assets[0].uri);
      else setLogoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
     <CommonHeader
                     useSafeAreaTop
                     children={
                         <View style={{ paddingBottom: 25 }}>
                             <Text style={styles.heading}>Let's get to know you.</Text>
                             <Text style={styles.subHeading}>Tell clients about yourself and your professional background</Text>
                             <Stepper length={2} currentStep={0} />
                         </View>
                     }
                 />

      {/* Progress Steps */}
      {/* <StepIndicator current={step === 1 ? 1 : 2} total={6} /> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {step === 1 ? (
          <Step1
            restaurantName={restaurantName}
            setRestaurantName={setRestaurantName}
            cuisineType={cuisineType}
            setCuisineType={setCuisineType}
            restaurantType={restaurantType}
            setRestaurantType={setRestaurantType}
            restaurantTypes={RESTAURANT_TYPES}
          />
        ) : (
          <Step2
            ownerName={ownerName}
            setOwnerName={setOwnerName}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            bannerUri={bannerUri}
            logoUri={logoUri}
            pickImage={pickImage}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => {
            if (step === 1) setStep(2);
            else navigate('LocationDetails');
          }}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

/* ─── Step 1: Tell us about your Business ─────────────────────── */
function Step1({ restaurantName, setRestaurantName, cuisineType, setCuisineType, restaurantType, setRestaurantType, restaurantTypes }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about your Business</Text>
      <Text style={styles.stepSubtitle}>Select the option that best describes you</Text>

      <InputText
        label="Restaurant Name"
        placeholder="e.g. Burger Palace"
        value={restaurantName}
        onChangeText={setRestaurantName}
        containerStyle={styles.input}
      />
      <InputText
        label="Cuisine Type"
        placeholder="e.g. Indian, Chinese"
        value={cuisineType}
        onChangeText={setCuisineType}
        containerStyle={styles.input}
      />

      <Text style={styles.fieldLabel}>Restaurant Type</Text>
      <View style={styles.chipRow}>
        {restaurantTypes.map((t: string) => (
          <TouchableOpacity
            key={t}
            onPress={() => setRestaurantType(t)}
            style={[
              styles.chip,
              restaurantType === t && styles.chipSelected,
            ]}
          >
            <Text style={[styles.chipText, restaurantType === t && styles.chipTextSelected]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ─── Step 2: Add Restaurant ───────────────────────────────────── */
function Step2({ ownerName, setOwnerName, phone, setPhone, email, setEmail, bannerUri, logoUri, pickImage }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add Restaurant</Text>
      <Text style={styles.stepSubtitle}>Basic information about your business</Text>

      {/* Banner */}
      <TouchableOpacity style={styles.bannerPicker} onPress={() => pickImage('banner')}>
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={styles.bannerImg} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerIcon}>🖼️</Text>
            <Text style={styles.bannerText}>Add Banner Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Logo */}
      <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage('logo')}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoImg} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.bannerIcon}>📷</Text>
          </View>
        )}
      </TouchableOpacity>

      <InputText
        label="Restaurant Name"
        placeholder="Enter name"
        value={ownerName}
        onChangeText={setOwnerName}
        containerStyle={styles.input}
      />
      <InputText
        label="Phone Number"
        placeholder="+91 XXXXXXXXXX"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        containerStyle={styles.input}
      />
      <InputText
        label="Email Address"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        containerStyle={styles.input}
      />
    </View>
  );
}

/* ─── Step Indicator ───────────────────────────────────────────── */
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
   heading: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textLight,
        letterSpacing: 0.3,
    },
    subHeading: {
        fontSize: 13,
        color: colors.secondaryLight,
        marginTop: 4,
        marginBottom: 18,
    },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
  },
  scroll: { paddingHorizontal: vw(5), paddingBottom: 120 },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.screen,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    width: '100%',
  },
  stepContainer: { paddingTop: 24 },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 24,
  },
  input: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.textLight, fontWeight: '600' },
  bannerPicker: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
    backgroundColor: colors.surfaceMuted,
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerIcon: { fontSize: 28, marginBottom: 6 },
  bannerText: { fontSize: 13, color: colors.textMuted },
  logoPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginTop: -40,
    marginLeft: 16,
    marginBottom: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.screen,
  },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryLight,
  },
  logoImg: { width: '100%', height: '100%' },
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
