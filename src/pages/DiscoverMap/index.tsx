import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import React, { useState, useRef } from 'react';
import CommonHeader, {
  BellIcon,
  HeaderIconButton,
  HeaderSearchInput,
} from '../../components/CommonHeader';
import { colors } from '../../styles/theme';
import ListingView from './ListingView';
import MapView from '../Map';

const SLIDER_WIDTH = (Dimensions.get('window').width - 20) / 2.05;

export default function DiscoverMap() {
  const [selectedButton, setSelectedButton] = useState('List');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleSelect = (btn: 'List' | 'map') => {
    setSelectedButton(btn);
    Animated.spring(slideAnim, {
      toValue: btn === 'List' ? 5 : SLIDER_WIDTH,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  return (
    <View style={{ flex: 1 }}>
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

      <View style={styles.buttons}>
        <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]} />
        <TouchableOpacity style={styles.button} onPress={() => handleSelect('List')}>
          <Text style={[styles.buttontext, { color: selectedButton === 'List' ? colors.textLight : colors.textDark }]}>List View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleSelect('map')}>
          <Text style={[styles.buttontext, { color: selectedButton === 'map' ? colors.textLight : colors.textDark }]}>Map View</Text>
        </TouchableOpacity>
      </View>
     {
       selectedButton == "List" ? <ListingView/> :<MapView/> 
     }
    </View>
  );
}

const styles = StyleSheet.create({
    buttons:{
        flexDirection:'row',
        alignItems:"center",
        borderColor:colors.placeholder,
        borderWidth:1,
        marginHorizontal:10,
        borderRadius:3,
        height:39,
        marginTop:10,
        overflow:'hidden',
        position:'relative',
    },
    slider:{
        position:'absolute',
        width:'50%',
        height:'90%',
        backgroundColor:colors.primary,
        borderRadius:3,
        marginVertical:5,
        
    },
    button:{
        height:34,
        justifyContent:"center",
        alignItems:"center",
        // borderColor:"black",
        // borderWidth:1,
        width:"48%",
        borderRadius:10,
        
    },
    buttontext:{
        fontWeight:"600"
    }
});
