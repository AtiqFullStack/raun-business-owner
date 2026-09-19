import * as React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../pages/Splash';
import Login from '../pages/Login';
import OtpScreen from '../pages/OtpScreen';
import MainStack from '../routes/TabNavigation';
import PopularResturants from '../pages/PopularResturants';
import RestaurantDetails from '../pages/RestaurantDetails';
import SelectLocation from '../pages/SelectLocation';
import Map from '../components/Map';
import GetStarted from '../pages/GetStarted';
import BusinessInfoSP from '../pages/BusinessInfo';
import BusinessInfoOwner from '../pages/BusinessInfoOwner';
import LocationDetails from '../pages/LocationDetails';
import BusinessHours from '../pages/BusinessHours';
import Documents from '../pages/Documents';
import ProfileUnderReview from '../pages/ProfileUnderReview';
import OwnerDashboard from '../pages/OwnerDashboard';
import BusinessSelector from '../pages/BusinessSelector';

export type RootStackParamList = {
  splash: undefined;
  login: undefined;
  app: undefined;
  PopularRestaurants: { categoryTitle?: string } | undefined;
  SelectLocation: undefined;
  tellBusiness:
    | {
        authDraft?: {
          email: string;
          password: string;
        };
      }
    | undefined;
  GetStarted: undefined;
  RestaurantDetails: {
    restaurantId: string;
  };
  otpScreen: {
    countryCode: string;
    phoneNumber: string;
  };
  Map: undefined;
  // ── Business Owner Onboarding ──────────────────────
  BusinessInfoSP:
    | {
        initialStep?: 1 | 2 | 3;
        authDraft?: {
          email: string;
          password: string;
          type: string;
        };
      }
    | undefined;
  BusinessInfoOwner:
    | {
        initialStep?: 1 | 2 | 3 | 4;
        authDraft?: {
          email: string;
          password: string;
          type: string;
        };
      }
    | undefined;
  LocationDetails: undefined;
  BusinessHours: undefined;
  Documents: undefined;
  ProfileUnderReview: undefined;
  OwnerDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="splash" component={Splash} />
      <Stack.Screen name="GetStarted" component={GetStarted} />
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="tellBusiness" component={BusinessSelector} />

      <Stack.Screen name="otpScreen" component={OtpScreen} />
      <Stack.Screen name="app" component={MainStack} />
      <Stack.Screen name="PopularRestaurants" component={PopularResturants} />
      <Stack.Screen name="SelectLocation" component={SelectLocation} />
      <Stack.Screen name="RestaurantDetails" component={RestaurantDetails} />
      <Stack.Screen name="Map" component={Map} />

      {/* Business Owner Onboarding Flow */}
      <Stack.Screen name="BusinessInfoOwner" component={BusinessInfoOwner} />
      {/* <Stack.Screen name="LocationDetails" component={LocationDetails} />
      <Stack.Screen name="BusinessHours" component={BusinessHours} />
      <Stack.Screen name="Documents" component={Documents} /> */}
      {/* <Stack.Screen name="ProfileUnderReview" component={ProfileUnderReview} /> */}
      {/* <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} /> */}

      {/* Service provider  Onboarding Flow */}
      <Stack.Screen name="BusinessInfoSP" component={BusinessInfoSP} />
      <Stack.Screen name="LocationDetails" component={LocationDetails} />
      <Stack.Screen name="BusinessHours" component={BusinessHours} />
      <Stack.Screen name="Documents" component={Documents} />
      <Stack.Screen name="ProfileUnderReview" component={ProfileUnderReview} />
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
    </Stack.Navigator>
  );
}
