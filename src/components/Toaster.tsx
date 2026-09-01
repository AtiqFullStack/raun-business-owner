import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../styles/theme'
import { useToast } from '../store/useToast'

export default function Toaster() {
  const insets = useSafeAreaInsets()
  const message = useToast(state => state.message)
  const type = useToast(state => state.type)
  const visible = useToast(state => state.visible)
  const hideToast = useToast(state => state.hideToast)
  const [shouldRender, setShouldRender] = useState(visible)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      Animated.timing(progress, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setShouldRender(false))
      return
    }

    setShouldRender(true)
    Animated.spring(progress, {
      damping: 15,
      mass: 0.8,
      stiffness: 160,
      toValue: 1,
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(hideToast, 2800)
    return () => clearTimeout(timer)
  }, [hideToast, visible, message, progress])

  if (!shouldRender) {
    return null
  }

  const accentStyle = type === 'success' ? styles.successAccent : styles.errorAccent
  const iconText = type === 'success' ? '✓' : '!'

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: insets.top + 12,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={hideToast} style={styles.card}>
        <View style={[styles.accent, accentStyle]} />
        <View style={[styles.iconWrap, accentStyle]}>
          <Text style={styles.icon}>{iconText}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>
            {type === 'success' ? 'Success' : 'Something went wrong'}
          </Text>
          <Text numberOfLines={2} style={styles.message}>
            {message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    elevation: 14,
    left: 16,
    position: 'absolute',
    right: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: 'row',
    minHeight: 62,
    overflow: 'hidden',
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 12,
  },
  accent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 5,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  successAccent: {
    backgroundColor: colors.success,
  },
  errorAccent: {
    backgroundColor: colors.error,
  },
  icon: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    
  },
})
