import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { colors } from '../styles/theme';
import { CountryPicker } from 'react-native-country-codes-picker';
import type { CountryItem } from 'react-native-country-codes-picker';
import KeyboardWrapper from '../components/KeyboardWrapper';
import { useAuthService } from '../services/authService';
import { useToast } from '../store/useToast';
import { loginPageImage } from '../assets/img';
import { vw } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'login'>;
const countryPickerHeight = Dimensions.get('window').height * 0.6;
const defaultMinPhoneLength = 6;
const maxPhoneLength = 15;
const minPhoneLengthByCountryCode: Record<string, number> = {
  '+91': 10,
};

export default function Login({ navigation }: Props) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [phoneNumber, setPhoneNumber] = useState('');
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  const { sendOtp, loading, error, clearError } = useAuthService();
  const showToast = useToast(state => state.showToast);
  const minPhoneLength =
    minPhoneLengthByCountryCode[countryCode] || defaultMinPhoneLength;
  const isPhoneValid = phoneNumber.length >= minPhoneLength;

  const handleCountrySelect = (item: CountryItem) => {
    setCountryCode(item.dial_code);
    setCountryFlag(item.flag);
    setShowCountryPicker(false);
  };

  const openCountryPicker = (event: GestureResponderEvent) => {
    event.stopPropagation();
    Keyboard.dismiss();
    setShowCountryPicker(true);
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value.replace(/\D/g, '').slice(0, maxPhoneLength));
  };

  const handleLogin = async () => {
    if (!isPhoneValid) {
      showToast(`Please enter at least ${minPhoneLength} digits.`, 'error');
      return;
    }

    try {
      clearError();
      const response = await sendOtp({
        countryCode,
        phoneNumber,
      });
      showToast(response.message || 'OTP sent successfully.', 'success');
      navigation.navigate('otpScreen', {
        countryCode,
        phoneNumber,
      });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to send OTP.';
      showToast(message, 'error');
    }
  };

  useEffect(() => {
    const animateKeyboardPadding = (toValue: number) => {
      Animated.timing(keyboardPadding, {
        duration: 220,
        toValue,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      animateKeyboardPadding(100);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      animateKeyboardPadding(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardPadding]);

  return (
    <KeyboardWrapper
    // keyboardVerticalOffset={70}
    >
      <Animated.View
        style={[
          styles.container,
          {
            paddingBottom: keyboardPadding,
          },
        ]}
      >
        <View style={styles.hero}>
          <Image
            source={loginPageImage}
            resizeMode="cover"
            style={{
              width: vw(100),
              height: '100%',
            }}
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Login or Sign Up</Text>

          <View style={styles.phoneRow}>
            <Pressable
              style={styles.countrySelector}
              onPress={openCountryPicker}
            >
              <Text style={styles.countryFlag}>{countryFlag}</Text>
              <View style={styles.dropdownIcon} />
            </Pressable>

            <View style={styles.phoneField}>
              <Pressable
                style={styles.codeSelector}
                onPress={openCountryPicker}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
              </Pressable>

              <View style={styles.inputDivider} />

              <TextInput
                keyboardType="phone-pad"
                maxLength={maxPhoneLength}
                onChangeText={handlePhoneNumberChange}
                placeholder=""
                placeholderTextColor={colors.placeholder}
                style={styles.phoneInput}
                value={phoneNumber}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

          <Pressable
            style={[
              styles.button,
              (loading || !isPhoneValid) && styles.disabledButton,
            ]}
            disabled={loading || !isPhoneValid}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
        </View>

        <CountryPicker
          show={showCountryPicker}
          lang="en"
          inputPlaceholder="Search country"
          searchMessage="No country found"
          inputPlaceholderTextColor={colors.placeholder}
          onBackdropPress={() => setShowCountryPicker(false)}
          onRequestClose={() => setShowCountryPicker(false)}
          pickerButtonOnPress={handleCountrySelect}
          style={{
            modal: styles.countryModal,
            textInput: styles.countrySearchInput,
          }}
        />
      </Animated.View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceDark,
    flex: 1,
    minHeight: '100%',
   
  },
  hero: {
    alignItems: 'center',
    height: '74%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: colors.surfaceDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    marginTop: -32,
    paddingHorizontal: 38,
    paddingTop: 36,
  },
  panelTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 34,
    textAlign: 'center',
  },
  phoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 50,
    marginBottom: 32,
  },
  countrySelector: {
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    borderColor: colors.serachnputBorder,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: '100%',
    justifyContent: 'center',
    width: 75,
  },
  countryFlag: {
    fontSize: 21,
  },
  phoneField: {
    alignItems: 'center',
    borderColor: colors.serachnputBorder,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden',
  },
  codeSelector: {
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 18,
  },
  countryCode: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownIcon: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 6,
    borderRightColor: 'transparent',
    borderRightWidth: 6,
    borderTopColor: colors.serachnputBorder,
    borderTopWidth: 7,
    height: 0,
    width: 0,
  },
  inputDivider: {
    backgroundColor: colors.serachnputBorder,
    height: 34,
    width: 1,
  },
  phoneInput: {
    color: colors.textLight,
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingHorizontal: 10,
    
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 7,
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  countryModal: {
    height: countryPickerHeight,
  },
  countrySearchInput: {
    color: colors.text,
    fontSize: 14,
  },
});
