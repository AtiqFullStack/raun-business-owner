import * as React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../pages/Splash';
import Login from '../pages/Login';
import OtpScreen from '../pages/OtpScreen';
import MainStack from '../routes/TabNavigation';
import PopularResturants from '../pages/PopularResturants';
import RestaurantDetails from '../pages/RestaurantDetails';
import SelectLocation from '../pages/SelectLocation';
import Map from '../pages/Map';

export type RootStackParamList = {
  splash: undefined;
  login: undefined;
  app: undefined;
  PopularRestaurants: { categoryTitle?: string } | undefined;
  SelectLocation: undefined;
  RestaurantDetails: {
    restaurantId: string;
  };
  otpScreen: {
    countryCode: string;
    phoneNumber: string;
  };
  Map:undefined;
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
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="otpScreen" component={OtpScreen} />
      <Stack.Screen name="app" component={MainStack} />
      <Stack.Screen name="PopularRestaurants" component={PopularResturants} />
      <Stack.Screen name="SelectLocation" component={SelectLocation} />
      <Stack.Screen name="RestaurantDetails" component={RestaurantDetails} />
      <Stack.Screen name="Map" component={Map} />
    </Stack.Navigator>
  );
}
