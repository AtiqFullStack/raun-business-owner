import useOwnerRealtime from './src/hooks/useOwnerRealtime';
import { flushDemandNotification } from './src/services/demandNotificationNavigation';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <NavigationContainer
        ref={navigationRef}
        onReady={flushDemandNotification}
        onStateChange={flushDemandNotification}
      >
        <RootStack />
      </NavigationContainer>
      <Toaster />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
