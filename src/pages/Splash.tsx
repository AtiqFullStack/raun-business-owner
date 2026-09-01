import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { colors } from '../styles/theme'
import { useAuth } from '../store/useAuth'
import Logo from '../assets/svg/Code/Logo'
import SplashBottom from '../assets/svg/Code/SplashBottom'
import Discover from '../assets/svg/Code/Discover'
import { splashImage } from '../assets/img'
import { storage } from '../utils/storage'

type Props = NativeStackScreenProps<RootStackParamList, 'splash'>

console.log(Logo)

export default function Splash({ navigation }: Props) {
  const token = useAuth(state => state.token)
  const hasHydrated = useAuth(state => state.hasHydrated)
  const [canNavigate, setCanNavigate] = useState(false)


  const checkAndNavigate = async (token: any) => {
    const showGetStarted = await storage.getItem("showGetStarted")
    if (showGetStarted === null) {
      navigation.replace('GetStarted')
    }
    if (showGetStarted === "false") {
      navigation.replace(token ? 'app' : 'login')
    }
  }

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

      checkAndNavigate(token)

    }, [canNavigate, hasHydrated, navigation, token])

    return (
      <View style={styles.container}>
        <Image
          source={splashImage}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {

      backgroundColor: colors.transparent,
      flex: 1

    },

  })
