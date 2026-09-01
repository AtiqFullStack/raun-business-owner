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
import { useLocationStore } from './src/store/useLocationStore';
import { useAddressService } from './src/services/addressService';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { getPhysicalLocations } = useLocation();
  const { getAddresses } = useAddressService();
  const hasHydrated = useAuth(state => state.hasHydrated);
  const token = useAuth(state => state.token);
  const setAddresses = useLocationStore(state => state.setAddresses);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token) {
      getPhysicalLocations();
      return;
    }

    getAddresses()
      .then(response => {
        const savedAddresses = response.data.addresses;

        setAddresses(savedAddresses);

        if (savedAddresses.length === 0) {
          getPhysicalLocations();
        }
      })
      .catch(() => {
        getPhysicalLocations();
      });
  }, [getAddresses, getPhysicalLocations, hasHydrated, setAddresses, token]);

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
      <NavigationContainer ref={navigationRef}>
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
