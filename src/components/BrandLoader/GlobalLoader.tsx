import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BrandLoader from './index';
import { useLoader } from '../../store/useLoader';
import { colors } from '../../styles/theme';

/** A transparent overlay; only the compact loading pill covers screen content. */
export default function GlobalLoader() {
  const loaders = useLoader(state => state.loaders);
  const messages = Object.values(loaders);
  if (!messages.length) return null;
  const message = messages[messages.length - 1];
  return (
    <View
      testID="global-loader-overlay"
      style={styles.overlay}
      accessibilityViewIsModal
    >
      <View
        style={styles.pill}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={message || 'Loading'}
        accessibilityState={{ busy: true }}
      >
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <BrandLoader size={44} text="" style={styles.loader} />
        </View>
        {!!message && (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pill: {
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loader: { padding: 0 },
  message: {
    flexShrink: 1,
    maxWidth: 180,
    paddingRight: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
