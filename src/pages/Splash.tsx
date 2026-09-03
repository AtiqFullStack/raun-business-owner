import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { colors } from '../styles/theme';
import { useAuth } from '../store/useAuth';
import { splashImage } from '../assets/img';
import { storage } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function Splash({ navigation }: Props) {
  const token = useAuth(state => state.token);
  const isProfileCompleted = useAuth(state => state.isProfileCompleted);
  const hasHydrated = useAuth(state => state.hasHydrated);
  const [canNavigate, setCanNavigate] = useState(false);

  const checkAndNavigate = useCallback(async () => {
    const showGetStarted = await storage.getItem('showGetStarted');
    if (showGetStarted === null) {
      navigation.replace('GetStarted');
      return;
    }

    if (showGetStarted === 'false') {
      navigation.replace(
        token && isProfileCompleted === true ? 'OwnerDashboard' : 'login',
      );
    }
  }, [isProfileCompleted, navigation, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanNavigate(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !canNavigate) {
      return;
    }

    checkAndNavigate();
  }, [canNavigate, checkAndNavigate, hasHydrated]);

  return (
    <View style={styles.container}>
      <Image source={splashImage} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.transparent,
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
