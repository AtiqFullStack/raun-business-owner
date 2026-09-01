import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../styles/theme';

type HeaderSlot = React.ReactNode;

export type CommonHeaderProps = {
  title?: HeaderSlot;
  subtitle?: HeaderSlot;
  left?: HeaderSlot;
  right?: HeaderSlot;
  beforeTitle?: HeaderSlot;
  afterTitle?: HeaderSlot;
  bottom?: HeaderSlot;
  children?: HeaderSlot;
  backgroundColor?: string;
  horizontalPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
  useSafeAreaTop?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  titleColumnStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  childrenContainerStyle?: StyleProp<ViewStyle>;
  bottomContainerStyle?: StyleProp<ViewStyle>;
};

export function CommonHeader({
  title,
  subtitle,
  left,
  right,
  beforeTitle,
  afterTitle,
  bottom,
  children,
  backgroundColor = colors.secondaryDark,
  horizontalPadding = 20,
  topPadding = 16,
  bottomPadding = 18,
  useSafeAreaTop = false,
  containerStyle,
  contentStyle,
  rowStyle,
  titleColumnStyle,
  titleStyle,
  subtitleStyle,
  childrenContainerStyle,
  bottomContainerStyle,
}: CommonHeaderProps) {
  const insets = useSafeAreaInsets();
  const resolvedTopPadding = topPadding + (useSafeAreaTop ? insets.top : 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingBottom: bottomPadding,
          paddingHorizontal: horizontalPadding,
          paddingTop: resolvedTopPadding,
        },
        containerStyle,
      ]}
    >
      <View style={[styles.content, contentStyle]}>
        {(left || title || subtitle || right || beforeTitle || afterTitle) && (
          <View style={[styles.row, rowStyle]}>
            {left ? <View style={styles.sideSlot}>{left}</View> : null}

            <View style={[styles.titleColumn, titleColumnStyle]}>
              {beforeTitle}
              {typeof title === 'string' ? (
                <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {typeof subtitle === 'string' ? (
                <Text
                  style={[styles.subtitle, subtitleStyle]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
              {afterTitle}
            </View>

            {right ? <View style={styles.sideSlot}>{right}</View> : null}
          </View>
        )}

        {children ? (
          <View style={[styles.childrenContainer, childrenContainerStyle]}>
            {children}
          </View>
        ) : null}

        {bottom ? (
          <View style={[styles.bottomContainer, bottomContainerStyle]}>
            {bottom}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export type HeaderSearchInputProps = TextInputProps & {
  leftIcon?: HeaderSlot;
  rightElement?: HeaderSlot;
  containerStyle?: StyleProp<ViewStyle>;
};

export function HeaderSearchInput({
  leftIcon = <SearchIcon />,
  rightElement,
  containerStyle,
  style,
  placeholderTextColor = colors.placeholder,
  ...props
}: HeaderSearchInputProps) {
  return (
    <View style={[styles.searchContainer, containerStyle]}>
      {leftIcon ? <View style={styles.searchIcon}>{leftIcon}</View> : null}
      <TextInput
        placeholderTextColor={placeholderTextColor}
        style={[styles.searchInput, style]}
        {...props}
      />
      {rightElement ? (
        <View style={styles.searchRight}>{rightElement}</View>
      ) : null}
    </View>
  );
}

export type HeaderIconButtonProps = {
  icon: HeaderSlot;
  onPress?: () => void;
  badgeCount?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  badgeTextStyle?: StyleProp<TextStyle>;
};

export function HeaderIconButton({
  icon,
  onPress,
  badgeCount,
  accessibilityLabel,
  disabled,
  style,
  badgeStyle,
  badgeTextStyle,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        disabled && styles.iconButtonDisabled,
        style,
      ]}
    >
      {icon}
      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, badgeTextStyle]} numberOfLines={1}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SearchIcon({ color = colors.textLight }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.75 18.5C6.47 18.5 3 15.03 3 10.75S6.47 3 10.75 3s7.75 3.47 7.75 7.75-3.47 7.75-7.75 7.75Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m16.5 16.5 4.5 4.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

export function BellIcon({ color = colors.textLight }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8.8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomEndRadius:21,
    borderBottomStartRadius:21,
    // paddingHorizontal:
  },
  content: {
    width: '100%',
    // borderWidth:1,
    // borderColor:"green"
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 36,
  },
  sideSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  subtitle: {
    color: colors.secondaryLight,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  childrenContainer: {
    marginTop: 14,
  },
  bottomContainer: {
    marginTop: 14,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    color: colors.textLight,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingVertical: 0,
  },
  searchRight: {
    marginLeft: 10,
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  iconButtonPressed: {
    opacity: 0.72,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 7,
    minWidth: 14,
    paddingHorizontal: 3,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  badgeText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'center',
  },
});

export default CommonHeader;
