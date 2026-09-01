import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../styles/theme';
import { vw, vh } from '../utils/responsive';
import Logo from '../assets/svg/Code/Logo';
import { navigate } from '../navigation/navigationRef';

export default function ProfileUnderReview() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo />
      </View>

      {/* Step Indicator — all filled */}
      <View style={styles.stepIndicator}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.stepDot, styles.stepDotActive]} />
        ))}
      </View>

      <View style={styles.body}>
        {/* Animated illustration */}
        <Animated.View style={[styles.illustrationWrapper, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.illustration}>🕐</Text>
        </Animated.View>

        <Text style={styles.badge}>Profile Under Review</Text>
        <Text style={styles.title}>Your Details Are Being Verified</Text>
        <Text style={styles.subtitle}>
          Our team is reviewing your documents and information. This usually takes{' '}
          <Text style={styles.highlight}>24–48 hours</Text>. We'll notify you once
          your profile is approved.
        </Text>

        {/* Status checklist */}
        <View style={styles.checkList}>
          <CheckItem label="Business Info Submitted" done />
          <CheckItem label="Location Details Added" done />
          <CheckItem label="Business Hours Configured" done />
          <CheckItem label="Documents Uploaded" done />
          <CheckItem label="Admin Verification" done={false} pending />
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigate('OwnerDashboard')}
        >
          <Text style={styles.homeBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Need help?{' '}
          <Text style={styles.helpLink}>Contact Support</Text>
        </Text>
      </View>
    </View>
  );
}

function CheckItem({ label, done, pending }: { label: string; done: boolean; pending?: boolean }) {
  return (
    <View style={checkStyles.row}>
      <View
        style={[
          checkStyles.icon,
          done ? checkStyles.iconDone : pending ? checkStyles.iconPending : checkStyles.iconEmpty,
        ]}
      >
        <Text style={checkStyles.iconText}>{done ? '✓' : pending ? '⏳' : '○'}</Text>
      </View>
      <Text style={[checkStyles.label, !done && checkStyles.labelMuted]}>{label}</Text>
    </View>
  );
}

const checkStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconDone: { backgroundColor: colors.success },
  iconPending: { backgroundColor: colors.warning },
  iconEmpty: { backgroundColor: colors.border },
  iconText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  label: { fontSize: 14, color: colors.text, fontWeight: '500' },
  labelMuted: { color: colors.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screen },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
  },
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

  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: vw(6),
    paddingTop: vh(4),
  },
  illustrationWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: colors.warning,
  },
  illustration: { fontSize: 52 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  highlight: { color: colors.primary, fontWeight: '700' },

  checkList: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },

  homeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },

  helpText: { fontSize: 13, color: colors.textMuted },
  helpLink: { color: colors.secondary, fontWeight: '600' },
});
