import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { HomeSvg, OrderSvg, ProfileSvg, BellSvg } from '../assets/svg';
import { colors } from '../styles/theme';
import BookingScreen from '../pages/BookingScreen';
import BookingDetailsScreen from '../pages/BookingDetailsScreen';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import MyCards from '../pages/MyCards';
import SelectLocation from '../pages/SelectLocation';
import HomeScreen from '../pages/HomeScreen';

type MainTabParamList = {
  Home: undefined;
  MyBookings: undefined;
  Notification: undefined;
  Account: undefined;
};
export type BookingStackParamList = {
  Booking: undefined;
  BookingDetails: { bookingId: string };
};
export type AccountStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyCards: undefined;
  SelectLocation: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const BookingStack = createNativeStackNavigator<BookingStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

function TabLabel({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <View style={styles.labelContainer}>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

function BookingTab() {
  return (
    <BookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingStack.Screen name="Booking" component={BookingScreen} />
      <BookingStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
      />
    </BookingStack.Navigator>
  );
}
function NotificationTab() {
  return (
    <View style={styles.emptyScreen}>
      <Text style={styles.emptyText}>Notification</Text>
    </View>
  );
}
function AccountTab() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="Profile" component={Profile} />
      <AccountStack.Screen name="EditProfile" component={EditProfile} />
      <AccountStack.Screen name="MyCards" component={MyCards} />
      <AccountStack.Screen name="SelectLocation" component={SelectLocation} />
    </AccountStack.Navigator>
  );
}

export default function MainStack() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondaryDark,
        tabBarInactiveTintColor: colors.text,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => <TabLabel label="Home" focused={focused} color={color} />,
          tabBarIcon: ({ color }) => (
            <HomeSvg color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={BookingTab}
        options={{
          title: 'My Bookings',
          tabBarLabel: ({ focused, color }) => <TabLabel label="My Bookings" focused={focused} color={color} />,
          tabBarIcon: ({ color }) => (
            <OrderSvg color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationTab}
        options={{
          tabBarLabel: ({ focused, color }) => <TabLabel label="Notification" focused={focused} color={color} />,
          tabBarIcon: ({ color }) => (
            <BellSvg color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountTab}
        options={{
          tabBarLabel: ({ focused, color }) => <TabLabel label="Account" focused={focused} color={color} />,
          tabBarIcon: ({ color }) => (
            <ProfileSvg color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 78,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: { height: 58 },
  labelContainer: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  activeIndicator: { position: 'absolute', top: 20, width: 62, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: colors.secondaryDark },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  emptyText: { color: colors.text, fontSize: 18 },
});
