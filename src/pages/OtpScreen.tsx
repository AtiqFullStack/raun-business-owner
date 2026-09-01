import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OtpInput } from 'react-native-otp-entry';
import type { RootStackParamList } from '../navigation';
import { colors } from '../styles/theme';
import { useAuth } from '../store/useAuth';
import LogoDark from '../assets/svg/Code/LogoDark';
import Discover from '../assets/svg/Code/Discover';
import KeyboardWrapper from '../components/KeyboardWrapper';
import { useAuthService } from '../services/authService';
import { useToast } from '../store/useToast';
import { NomralleftArrow } from '../assets/svg';

type Props = NativeStackScreenProps<RootStackParamList, 'otpScreen'>;
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpScreen({ navigation, route }: Props) {
  const login = useAuth(state => state.login);
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const { countryCode, phoneNumber } = route.params;
  const { sendOtp, verifyOtp, loading, error, clearError } = useAuthService();
  const showToast = useToast(state => state.showToast);

  const maskedPhone = useMemo(() => {
    const visibleDigits = phoneNumber.slice(-3);
    return `${countryCode} *****${visibleDigits}`;
  }, [countryCode, phoneNumber]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds(seconds => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      return;
    }

    try {
      clearError();
      const response = await verifyOtp({
        countryCode,
        phoneNumber,
        otp,
      });
      const { user, token } = response.data;
      const profileDetails = user.profileDetails || {
        firstName: '',
        lastName: '',
        phoneNumber: user.fullPhoneNumber,
        email: user.email || '',
        role: user.role || 'user',
        profileImage: user.profileImage?.url,
      };
      const displayName =
        `${profileDetails.firstName} ${profileDetails.lastName}`.trim() ||
        user.fullPhoneNumber;
      showToast(response.message || 'OTP verified successfully.', 'success');

      login(
        {
          id: user.id,
          userAuthId: user.userAuthId,
          name: displayName,
          email: profileDetails.email,
          role: profileDetails.role,
          profileDetails,
        },
        token,
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'app' }],
      });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to verify OTP.';
      showToast(message, 'error');
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) {
      return;
    }

    try {
      clearError();
      setOtp('');
      const response = await sendOtp({
        countryCode,
        phoneNumber,
      });
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      showToast(response.message || 'OTP resent successfully.', 'success');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to resend OTP.';
      showToast(message, 'error');
    }
  };

  return (
    <KeyboardWrapper>
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
         <NomralleftArrow/>
        </Pressable>

        <View style={styles.header}>
          <LogoDark />
          {/* <View style={styles.logoRow}>
          <Text style={styles.logoMark}>r</Text>
          <Text style={styles.logoText}>aun</Text>
        </View> */}
          <View style={styles.taglineRow}>
            <Discover color={'black'} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.message}>
            Enter the verification code we just sent to your number
          </Text>
          <Text style={styles.phoneText}>{maskedPhone}</Text>

          <OtpInput
            numberOfDigits={6}
            autoFocus
            focusColor={colors.primary}
            onTextChange={setOtp}
            textInputProps={{
              caretHidden: true,
              contextMenuHidden: true,
              selection: {
                end: otp.length,
                start: otp.length,
              },
            }}
            type="numeric"
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.otpBox,
              focusedPinCodeContainerStyle: styles.otpBoxFocused,
              filledPinCodeContainerStyle: styles.otpBoxFilled,
              pinCodeTextStyle: styles.otpText,
            }}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{"Didn't receive code?"}</Text>
            <Pressable
              disabled={loading || resendSeconds > 0}
              onPress={handleResend}
            >
              <Text
                style={[
                  styles.resendLink,
                  (loading || resendSeconds > 0) && styles.resendLinkDisabled,
                ]}
              >
                {resendSeconds > 0 ? ` Resend in ${resendSeconds}s` : ' Resend'}
              </Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>

        <Pressable
          style={[
            styles.verifyButton,
            (otp.length < 6 || loading) && styles.disabledButton,
          ]}
          disabled={otp.length < 6 || loading}
          onPress={handleVerify}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.verifyText}>Verify</Text>
          )}
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.screen,
    flex: 1,
    paddingHorizontal: 28,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: 14,
    width: 36,
  },
  backText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '400',
  },
  header: {
    alignItems: 'center',
    marginTop: 42,
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoMark: {
    color: colors.primary,
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 64,
  },
  logoText: {
    color: colors.surfaceDark,
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 64,
  },
  taglineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 50,
  },
  tagline: {
    color: colors.surfaceDark,
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  taglineLine: {
    backgroundColor: colors.primary,
    height: 1,
    width: 18,
  },
  content: {
    alignItems: 'center',
    marginTop: 74,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  phoneText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 3,
  },
  otpContainer: {
    gap: 12,
    marginTop: 36,
    width: 'auto',
  },
  otpBox: {
    borderColor: colors.secondary,
    borderRadius: 5,
    borderWidth: 1.5,
    height: 50,
    width: 50,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
  },
  otpBoxFilled: {
    borderColor: colors.secondary,
  },
  otpText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    marginTop: 22,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'none',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  verifyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 4,
    bottom: 54,
    height: 48,
    justifyContent: 'center',
    left: 28,
    position: 'absolute',
    right: 28,
  },
  disabledButton: {
    opacity: 1,
  },
  verifyText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
});
