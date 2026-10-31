import useOwnerRealtime from './src/hooks/useOwnerRealtime';
import { flushDemandNotification } from './src/services/demandNotificationNavigation';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { RootStack } from './src/navigation';
import { navigationRef } from './src/navigation/navigationRef';
import { colors } from './src/styles/theme';
import Toaster from './src/components/Toaster';
import useLocation from './src/hooks/useLocation';
import { useAuth } from './src/store/useAuth';
import GlobalLoader from './src/components/BrandLoader/GlobalLoader';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  useOwnerRealtime();
  const insets = useSafeAreaInsets();
  const isProvider = useAuth(state => state.ownerType === 'SERVICE_PROVIDER');
  const { getPhysicalLocations } = useLocation();
  const hasHydrated = useAuth(state => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    // Owner registration uses its own address/working-area fields. Do not call
    // customer address APIs when an owner token is created during onboarding.
    getPhysicalLocations();
  }, [getPhysicalLocations, hasHydrated]);

  return (
    <View
      style={[
        styles.container,
        isProvider && styles.providerContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {isProvider && (
        <StatusBar barStyle="light-content" backgroundColor="#164C48" />
      )}
      {isProvider && (
        <View
          pointerEvents="none"
          style={[styles.providerBottom, { height: insets.bottom }]}
        />
      )}
      <NavigationContainer
        ref={navigationRef}
        onReady={flushDemandNotification}
        onStateChange={flushDemandNotification}
      >
        <RootStack />
      </NavigationContainer>
      <GlobalLoader />
      <Toaster />
    </View>
  );
}

const styles = StyleSheet.create({
  providerContainer: { backgroundColor: '#164C48' },
  providerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
