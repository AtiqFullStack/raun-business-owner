import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { colors } from '../../styles/theme';

type BrandLoaderProps = {
  size?: number;
  text?: string;
  color?: string;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

/** A branded, indeterminate loader. `size` controls the outer orbit. */
export default function BrandLoader({
  size = 72,
  text = 'Loading...',
  color = colors.primary,
  fullScreen = false,
  style,
  textStyle,
  testID,
}: BrandLoaderProps) {
  const phase = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const diameter = Number.isFinite(size) ? Math.max(24, size) : 72;
  const stageSize = diameter * 1.3;
  const tileSize = diameter * 0.46;

  useEffect(() => {
    let mounted = true;
    let settingChanged = false;
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        settingChanged = true;
        setReduceMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted && !settingChanged) setReduceMotion(enabled);
      })
      .catch(() => {
        /* Keep the static loader if the preference is unavailable. */
      });
    const appState = AppState.addEventListener('change', state =>
      setAppActive(state === 'active'),
    );
    return () => {
      mounted = false;
      motion.remove();
      appState.remove();
    };
  }, []);

  useEffect(() => {
    phase.setValue(0);
    if (reduceMotion || !appActive) return;
    const animation = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      phase.stopAnimation();
    };
  }, [phase, reduceMotion, appActive]);

  const rotate = phase.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '270deg'],
  });
  const breathe = phase.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.06, 1],
  });
  const haloScale = phase.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.14, 1],
  });
  const haloOpacity = phase.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.04, 0.08, 0.04],
  });

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={text || 'Loading'}
      accessibilityState={{ busy: true }}
      style={[styles.container, fullScreen && styles.fullScreen, style]}
    >
      <View
        style={[styles.stage, { width: stageSize, height: stageSize }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Animated.View
          style={[
            styles.halo,
            {
              width: diameter * 1.2,
              height: diameter * 1.2,
              borderRadius: diameter,
              backgroundColor: color,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
        <View
          style={[
            styles.innerHalo,
            {
              width: diameter * 0.81,
              height: diameter * 0.81,
              borderRadius: diameter,
              borderColor: color,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.orbit,
            { width: diameter, height: diameter, transform: [{ rotate }] },
          ]}
        >
          <Svg width={diameter} height={diameter} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient
                id="brand-loader-orbit"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0" stopColor={color} stopOpacity="0.15" />
                <Stop offset="0.55" stopColor={color} stopOpacity="0.8" />
                <Stop offset="1" stopColor={color} />
              </LinearGradient>
            </Defs>
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={colors.border}
              strokeWidth="2"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#brand-loader-orbit)"
              strokeWidth="3.5"
              strokeDasharray="190 93"
              strokeLinecap="round"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="35"
              stroke={colors.secondary}
              strokeWidth="2"
              strokeDasharray="37 183"
              strokeLinecap="round"
              fill="none"
              transform="rotate(130 50 50)"
            />
            <Circle
              cx="95"
              cy="50"
              r="4"
              fill={colors.secondary}
              stroke={colors.surface}
              strokeWidth="2"
            />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            styles.brandTile,
            {
              width: tileSize,
              height: tileSize,
              borderRadius: diameter * 0.155,
              backgroundColor: color,
              transform: [{ scale: breathe }],
            },
          ]}
        >
          <Svg
            width={tileSize * 0.62}
            height={tileSize * 0.68}
            viewBox="0 0 48 56"
          >
            <Path
              d="M29.7769 4.44719C22.8045 4.44719 16.8962 6.58259 13.1104 10.9647C12.9463 11.1531 12.7909 11.3449 12.6372 11.5435C9.879 15.0386 8.32806 19.8454 8.32806 26.0119V54.8972H17.8927V26.0119C17.8927 16.9291 22.625 13.2354 29.7769 13.2354C31.1085 13.2354 32.3659 13.369 33.523 13.6464V4.66467C32.321 4.52082 31.0688 4.44719 29.7769 4.44719Z"
              fill={colors.surface}
            />
            <Path
              d="M13.1104 12.0675C12.955 11.8894 12.7961 11.7113 12.6372 11.5435C9.53533 8.24537 5.19685 6.32573 0 5.7435V14.6978C5.12085 15.8109 8.32808 19.6382 8.32808 27.1147V56H17.8928V27.1147C17.8928 20.6023 16.1622 15.6037 13.1104 12.0675Z"
              fill={colors.surface}
            />
            <Path
              d="M47.1274 9.57764L33.523 19.1519V0L47.1274 9.57764Z"
              fill={colors.secondary}
            />
          </Svg>
        </Animated.View>
      </View>
      {!!text && (
        <View style={styles.caption}>
          <Text style={[styles.text, { color }, textStyle]}>{text}</Text>
          <View
            style={styles.dots}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {[0, 1, 2].map(index => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === 2 ? colors.secondary : color,
                    opacity: phase.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange:
                        index === 0
                          ? [0.9, 0.45, 0.25, 0.45, 0.9]
                          : index === 1
                          ? [0.45, 0.9, 0.45, 0.25, 0.45]
                          : [0.25, 0.45, 0.9, 0.45, 0.25],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, width: '100%', backgroundColor: colors.screen },
  stage: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
  innerHalo: { position: 'absolute', borderWidth: 1, opacity: 0.08 },
  orbit: { position: 'absolute' },
  brandTile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  caption: { alignItems: 'center', marginTop: 14, gap: 12 },
  text: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.35,
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
