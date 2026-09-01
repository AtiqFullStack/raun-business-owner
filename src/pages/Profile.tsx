import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import CommonHeader from '../components/CommonHeader';
import type { AccountStackParamList } from '../routes/TabNavigation';
import { useAuth } from '../store/useAuth';
import { colors } from '../styles/theme';

import RightArrow from '../assets/svg/Code/RightArrow';
import getImageUrl from '../utils/urlConvertor';

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
};

type IconProps = {
  color?: string;
  size?: number;
};

const PROFILE_MENU: Omit<MenuItem, 'onPress'>[] = [
  {
    label: 'Your Orders',
    icon: <ReceiptIcon />,
  },
  {
    label: 'Address',
    icon: <LocationIcon />,
  },
  {
    label: 'My Cards',
    icon: <CardIcon />,
  },
  {
    label: 'About',
    icon: <InfoIcon />,
  },
  {
    label: 'Privacy Policy',
    icon: <DocumentIcon />,
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
  },
  {
    label: 'Help & Support',
    icon: <HelpIcon />,
  },
];



export default function Profile() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const user = useAuth(state => state.user);
  const logout = useAuth(state => state.logout);
  const profileDetails = user?.profileDetails;
  const displayName =
    user?.name ||
    `${profileDetails?.firstName ?? 'Abdul'} ${
      profileDetails?.lastName ?? 'Hamid'
    }`.trim();
  const phoneNumber = profileDetails?.phoneNumber || '+673 258 888 888';
  const profileImage = getImageUrl(profileDetails?.profileImage);

  const menuItems: MenuItem[] = [
    ...PROFILE_MENU.map(item => ({
      ...item,
      onPress: (() => {
        if (item.label === 'Address') {
          return () => {
            navigation.navigate('SelectLocation');
          };
        }

        if (item.label === 'My Cards') {
          return () => {
            navigation.navigate('MyCards');
          };
        }

        return undefined;
      })(),
    })),
    {
      label: 'Logout',
      danger: true,
      icon: <LogoutIcon color={colors.primary} />,
      onPress: () => {
        logout();
        navigation
          .getParent()
          ?.getParent()
          ?.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'login' }],
            }),
          );
      },
    },
  ];

  return (
    <View style={styles.screen}>
      <CommonHeader
        title="Profile"
        bottomPadding={18}
        horizontalPadding={14}
        topPadding={14}
        containerStyle={styles.header}
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profilePhone} numberOfLines={1}>
              {phoneNumber}
            </Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editButton}
            >
              <Text style={styles.editText}>Edit Profile</Text>
              <RightArrow />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Food Delivery</Text>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <MenuRow
              key={item.label}
              item={item}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const tintColor = item.danger ? colors.primary : colors.secondary;

  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !isLast && styles.menuDivider,
        pressed && styles.menuRowPressed,
      ]}
    >
      <View style={styles.menuIcon}>{item.icon}</View>
      <Text
        style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <ChevronIcon color={tintColor} />
    </Pressable>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function IconFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.iconFrame, style]}>{children}</View>;
}

function ReceiptIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 3h10v18l-2-1.2L13 21l-2-1.2L9 21l-2-1.2V3Z"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Path
          d="M9.5 8h5M9.5 12h5M9.5 16h3"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={1.7}
        />
      </Svg>
    </IconFrame>
  );
}

function LocationIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Circle cx={12} cy={10} r={2.2} stroke={color} strokeWidth={1.7} />
      </Svg>
    </IconFrame>
  );
}

function CardIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          height={12}
          rx={2}
          stroke={color}
          strokeWidth={1.7}
          width={18}
          x={3}
          y={6}
        />
        <Path d="M3 10h18M7 15h4" stroke={color} strokeWidth={1.7} />
      </Svg>
    </IconFrame>
  );
}

function InfoIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.7} />
        <Path
          d="M12 11v5M12 8h.01"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={1.9}
        />
      </Svg>
    </IconFrame>
  );
}

function DocumentIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 3h7l4 4v14H7V3Z"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Path
          d="M14 3v5h4M9.5 12h5M9.5 16h5"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
      </Svg>
    </IconFrame>
  );
}

function SettingsIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
          stroke={color}
          strokeWidth={1.7}
        />
        <Path
          d="m19 13 .2-1-.2-1 1.5-1.2-1.6-2.8-1.9.8a7.7 7.7 0 0 0-1.7-1L15 4.7h-3.2l-.3 2.1c-.6.2-1.2.6-1.7 1L8 7 6.4 9.8 8 11l-.2 1 .2 1-1.6 1.2L8 17l1.8-.8c.5.4 1.1.7 1.7 1l.3 2.1H15l.3-2.1c.6-.2 1.2-.6 1.7-1l1.9.8 1.6-2.8L19 13Z"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={1.45}
        />
      </Svg>
    </IconFrame>
  );
}

function HelpIcon({ color = colors.secondary, size = 18 }: IconProps) {
  return (
    <IconFrame>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.7} />
        <Path
          d="M9.8 9.5A2.4 2.4 0 0 1 12.2 8c1.4 0 2.5.9 2.5 2.2 0 1.7-1.7 2-2.4 3.1-.2.3-.3.7-.3 1.2M12 17h.01"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
      </Svg>
    </IconFrame>
  );
}

function LogoutIcon({ color = colors.primary, size = 18 }: IconProps) {
  return (
    <IconFrame style={styles.logoutIconFrame}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Path
          d="m15 8 4 4-4 4M19 12H9"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
      </Svg>
    </IconFrame>
  );
}

function ChevronIcon({ color = colors.secondary, size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m9 18 6-6-6-6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 14,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 4,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 86,
    paddingHorizontal: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  avatarImage: {
    height: 48,
    width: 48,
  },
  avatarText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  profileName: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  profilePhone: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 10,
  },
  editText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginRight: 10,
  },
  editArrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 3,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 39,
    paddingHorizontal: 12,
  },
  menuRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  menuDivider: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  menuIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  iconFrame: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  logoutIconFrame: {
    marginLeft: -1,
  },
  menuLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 10,
  },
  menuLabelDanger: {
    color: colors.primary,
  },
});
