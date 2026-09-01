import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { colors } from '../styles/theme'
import { useAuth } from '../store/useAuth'
import Logo from '../assets/svg/Code/Logo'
import SplashBottom from '../assets/svg/Code/SplashBottom'
import Discover from '../assets/svg/Code/Discover'

type Props = NativeStackScreenProps<RootStackParamList, 'splash'>

console.log(Logo)

export default function Splash({ navigation }: Props) {
  const token = useAuth(state => state.token)
  const hasHydrated = useAuth(state => state.hasHydrated)
  const [canNavigate, setCanNavigate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanNavigate(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hasHydrated || !canNavigate) {
      return
    }

    navigation.replace(token ? 'app' : 'login')
  }, [canNavigate, hasHydrated, navigation, token])

  return (
    <View style={styles.container}>
      <View style={styles.brandContent}>
        <Logo  />
      </View>
      <View style={{
        marginTop:-150
      }}>
            <Discover />
      </View>


      <SplashBottom />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 160,
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  brandContent: {
    alignItems: 'center',
  },
  tagline: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginHorizontal: 8,
  },
  taglineLine: {
    backgroundColor: colors.primary,
    height: 1,
    width: 12,
  },
  taglineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 22,
  },
})
