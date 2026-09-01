import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';
import {
  HomeSvg,
  MainSvg,
  OffeCodeSvg,
  OrderSvg,
  ProfileSvg,
} from '../assets/svg';
import CommonHeader, {
  BellIcon,
  HeaderIconButton,
  HeaderSearchInput,
} from '../components/CommonHeader';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import HomeScreen from '../pages/HomeScreen';
import MyCards from '../pages/MyCards';
import SelectLocation from '../pages/SelectLocation';
import DiscoverMap from '../pages/DiscoverMap';

type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Discover: undefined;
  Offers: undefined;
  Account: undefined;
};

export type AccountStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyCards: undefined;
  SelectLocation: undefined;
};

type TabLabelProps = {
  focused: boolean;
  label: string;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const AccountStackNavigator =
  createNativeStackNavigator<AccountStackParamList>();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>{title}fsd</Text>
    </View>
  );
}

function OrdersTabScreen() {
  return <PlaceholderScreen title="Orders" />;
}

function DiscoverTabScreen() {
  return (
    <View style={styles.discoverScreen}>
      <CommonHeader
        title="Discover Brunei"
        right={
          <HeaderIconButton
            accessibilityLabel="Notifications"
            badgeCount={5}
            icon={<BellIcon />}
          />
        }
      >
        <HeaderSearchInput placeholder="Search Business around you" />
      </CommonHeader>

      <View style={styles.discoverContent}>
        <Text style={styles.screenTitle}>Discover Map</Text>
      </View>
    </View>
  );
}

function OffersTabScreen() {
  return <PlaceholderScreen title="Offers" />;
}

function AccountTabScreen() {
  return (
    <AccountStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <AccountStackNavigator.Screen name="Profile" component={Profile} />
      <AccountStackNavigator.Screen
        name="EditProfile"
        component={EditProfile}
      />
      <AccountStackNavigator.Screen name="MyCards" component={MyCards} />
      <AccountStackNavigator.Screen
        name="SelectLocation"
        component={SelectLocation}
      />
    </AccountStackNavigator.Navigator>
  );
}

type TabIconProps = {
  color: string;
};

function HomeIcon({ color }: TabIconProps) {
  return <HomeSvg color={color} />;
}

function OrdersIcon({ color }: TabIconProps) {
  return <OrderSvg color={color} />;
}

function DiscoverIcon() {
  return <MainSvg width={56} height={56} />;
}

function OffersIcon({ color }: TabIconProps) {
  return <OffeCodeSvg color={color} />;
}

function AccountIcon({ color }: TabIconProps) {
  return <ProfileSvg color={color} />;
}

function CenterTabButton({
  children,
  onPress,
  accessibilityState,
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;
  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const animatedStyle = {
    transform: [
      {
        scale: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
      {
        translateY: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={styles.centerTabButton}
    >
      <Animated.View
        style={[
          styles.centerButton,
          focused && styles.centerButtonFocused,
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function renderHomeIcon({ color }: { color: string }) {
  return <HomeIcon color={color} />;
}

function renderOrdersIcon({ color }: { color: string }) {
  return <OrdersIcon color={color} />;
}

function renderDiscoverIcon() {
  return <DiscoverIcon />;
}

function renderOffersIcon({ color }: { color: string }) {
  return <OffersIcon color={color} />;
}

function renderAccountIcon({ color }: { color: string }) {
  return <AccountIcon color={color} />;
}

function TabLabel({ focused, label }: TabLabelProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 9,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const indicatorStyle = {
    opacity: progress,
    transform: [
      {
        scaleX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.25, 1],
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.labelContainer}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
      <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
    </View>
  );
}

function renderHomeLabel({ focused }: { focused: boolean }) {
  return <TabLabel focused={focused} label="Home" />;
}

function renderOrdersLabel({ focused }: { focused: boolean }) {
  return <TabLabel focused={focused} label="Orders" />;
}

function renderOffersLabel({ focused }: { focused: boolean }) {
  return <TabLabel focused={focused} label="Offers" />;
}

function renderAccountLabel({ focused }: { focused: boolean }) {
  return <TabLabel focused={focused} label="Account" />;
}

function renderDiscoverLabel({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerLabelContainer}>
      <Text
        style={[styles.centerTabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
        Discover
      </Text>
      <Text
        style={[styles.centerTabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
        Map
      </Text>
    </View>
  );
}

function MainStack() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.text,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: renderHomeIcon,
          tabBarLabel: renderHomeLabel,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersTabScreen}
        options={{
          tabBarIcon: renderOrdersIcon,
          tabBarLabel: renderOrdersLabel,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverMap}
        options={{
          tabBarButton: CenterTabButton,
          tabBarIcon: renderDiscoverIcon,
          tabBarLabel: renderDiscoverLabel,
        }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersTabScreen}
        options={{
          tabBarIcon: renderOffersIcon,
          tabBarLabel: renderOffersLabel,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountTabScreen}
        options={{
          tabBarIcon: renderAccountIcon,
          tabBarLabel: renderAccountLabel,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.screen,
    flex: 1,
    justifyContent: 'center',
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  discoverScreen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  discoverContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 82,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 82,
    paddingBottom: 10,
    paddingTop: 8,
    position: 'absolute',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  tabItem: {
    height: 64,
    paddingTop: 6,
  },
  tabLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  labelContainer: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'flex-start',
    marginTop: 2,
    width: 76,
  },
  activeIndicator: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    height: 10,
    marginTop: 9,
    width: 76,
  },
  centerTabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    top: -15,
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonFocused: {
    backgroundColor: colors.primaryDark,
  },
  centerLabelContainer: {
    alignItems: 'center',
    // height: 30,
    justifyContent: 'center',
    marginTop: 20,
    width: 78,
  },
  centerTabLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
    textAlign: 'center',
  },
});

export default MainStack;
