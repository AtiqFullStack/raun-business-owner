import React from 'react';
import {
  Image,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';
import { vw, vh } from '../utils/responsive';
import { navigate } from '../navigation/navigationRef';
import { profileUnderReviewImage } from '../assets/img';

export default function ProfileUnderReview() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Profile Under Review</Text>
        <Text style={styles.headerSubtitle}>Your Profile Under Review</Text>
      </View>

      <View style={styles.body}>
        <Image
          source={profileUnderReviewImage}
          style={styles.illustration}
          resizeMode="contain"
        />
        <Text style={styles.title}>Your Details Are Being Verified</Text>
        <Text style={styles.subtitle}>
          We are reviewing your details. This won't take long.
          {'\n'}
          We'll notify you once approved.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dashboardButton}
          onPress={() => navigate('OwnerDashboard')}
        >
          <Text style={styles.dashboardButtonText}>Go To Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screen,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  headerSubtitle: {
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustration: {
    width: vw(78),
    maxWidth: 338,
    aspectRatio: 338 / 206,
    marginTop: vh(19),
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 14,
  },
  dashboardButton: {
    width: '100%',
    maxWidth: 330,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  dashboardButtonText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '500',
  },
});
