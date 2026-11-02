import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import KeyboardWrapper from '../components/KeyboardWrapper';
import CommonHeader from '../components/CommonHeader';
import InputText from '../components/InputText';
import Button from '../components/Button';
import {
  isApiSuccess,
  useBusinessOwnerService,
} from '../services/businessOwnerService';
import { colors } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'forgotPassword'>;
export default function ForgotPassword({ route, navigation }: Props) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const { forgotPassword, resetPassword, loading } = useBusinessOwnerService();
  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    if (Date.now() < resendAt) {
      setError('Please wait one minute before requesting another code.');
      return;
    }
    setErrors({});
    setError('');
    setMessage('');
    try {
      const response = await forgotPassword(email.trim());
      if (!isApiSuccess(response.success))
        throw new Error(
          response.message ||
            'Unable to send the reset code. Please try again.',
        );
      setSent(true);
      setOtp('');
      setResendAt(Date.now() + 60000);
      setMessage(response.message || 'Check your email for a reset code.');
    } catch (err: any) {
      setError(
        err?.message || 'Unable to send the reset code. Please try again.',
      );
    }
  };
  const reset = async () => {
    const next: Record<string, string> = {};
    if (!/^\d{6}$/.test(otp))
      next.otp = 'Enter the 6-digit reset code from your email.';
    if (password.length < 6)
      next.password = 'Use at least 6 characters for your new password.';
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length) return;
    try {
      const response = await resetPassword({
        email: email.trim(),
        otp,
        password,
      });
      if (!isApiSuccess(response.success))
        throw new Error(
          response.message ||
            'Unable to reset your password. Please try again.',
        );
      setPassword('');
      setConfirm('');
      setOtp('');
      setDone(true);
      setMessage(
        'Password reset successfully. Sign in with your new password.',
      );
    } catch (err: any) {
      setError(
        err?.message || 'Unable to reset your password. Please try again.',
      );
    }
  };
  return (
    <KeyboardWrapper scroll>
      <CommonHeader
        title="Forgot Password"
        useSafeAreaTop
        left={
          <Text
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={{ color: colors.textLight, padding: 8 }}
          >
            Back
          </Text>
        }
      />
      <View style={styles.content}>
        <Text style={styles.copy}>
          {done
            ? 'Your password has been updated.'
            : 'Enter your registered email address to reset your password.'}
        </Text>
        {!!message && (
          <Text accessibilityLiveRegion="polite" style={styles.copy}>
            {message}
          </Text>
        )}
        {!done && (
          <>
            <InputText
              label="Email"
              value={email}
              onChangeText={value => {
                setEmail(value);
                setErrors({});
                setError('');
              }}
              editable={!sent && !loading}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
            {sent && (
              <>
                <InputText
                  label="Reset Code"
                  value={otp}
                  onChangeText={value => {
                    setOtp(value.replace(/\D/g, '').slice(0, 6));
                    setErrors(prev => ({ ...prev, otp: '' }));
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp}
                />
                <InputText
                  label="New Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password}
                />
                <InputText
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.confirm}
                />
              </>
            )}
          </>
        )}
        {!!error && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          title={
            done ? 'Back to Login' : sent ? 'Reset Password' : 'Send Reset Code'
          }
          loading={loading}
          onPress={done ? () => navigation.goBack() : sent ? reset : send}
        />
        {sent && !done && (
          <>
            <Text
              accessibilityRole="button"
              disabled={loading}
              onPress={loading ? undefined : send}
              style={styles.link}
            >
              Resend Code
            </Text>
            <Text
              accessibilityRole="button"
              disabled={loading}
              onPress={
                loading
                  ? undefined
                  : () => {
                      setSent(false);
                      setError('');
                      setMessage('');
                      setErrors({});
                      setPassword('');
                      setConfirm('');
                    }
              }
              style={styles.link}
            >
              Use a different email
            </Text>
          </>
        )}
      </View>
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 80, gap: 12 },
  copy: { color: colors.text, fontSize: 14, lineHeight: 22 },
  error: { color: colors.error, fontSize: 13, lineHeight: 20 },
  link: { color: colors.primary, paddingVertical: 12, textAlign: 'center' },
});
