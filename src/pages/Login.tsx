import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { colors } from '../styles/theme';
import Logo from '../assets/svg/Code/Logo';
import { EmailSvg, LockSvg } from '../assets/svg';
import { vw } from '../utils/responsive';
import Button from '../components/Button';
import PartnerSvg from '../assets/svg/Code/PartnerSvg';
import { navigate, resetTo } from '../navigation/navigationRef';
import InputText from '../components/InputText';
import { Eye, EyeOff } from 'lucide-react-native';
import KeyboardWrapper from '../components/KeyboardWrapper';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import {
  isApiSuccess,
  useBusinessOwnerService,
  type BusinessOwner,
} from '../services/businessOwnerService';

const buildOwnerUser = (owner: BusinessOwner) => ({
  id: owner._id,
  userAuthId: owner.userAuthId || undefined,
  name: owner.email,
  email: owner.email,
  role: owner.role,
  profileDetails: {
    firstName: '',
    lastName: '',
    phoneNumber: owner.phoneNumber || '',
    email: owner.email,
    role: owner.role,
  },
});

const isMissingServiceTypeResponse = (response?: {
  success?: boolean | string;
  code?: number;
  type?: string;
  message?: string;
  data?: unknown;
}) =>
  response &&
  !isApiSuccess(response.success) &&
  response.code === 400 &&
  response.type === 'VALIDATION_ERROR' &&
  response.message === 'Service type is required' &&
  response.data === null;

const PROFILE_REVIEW_MESSAGE =
  'Your profile is under review. You can sign in once it’s approved.';

const isPendingApprovalResponse = (response?: {
  success?: boolean | string;
  code?: number;
  type?: string;
  message?: string;
  data?: unknown;
}) =>
  response &&
  !isApiSuccess(response.success) &&
  response.code === 403 &&
  response.type === 'FORBIDDEN' &&
  ['Your profile is pending admin approval', PROFILE_REVIEW_MESSAGE].includes(
    response.message || '',
  ) &&
  response.data === null;

const getResponseIsProfileCompleted = (response?: {
  data?: {
    isProfileCompleted?: boolean;
    owner?: { isProfileCompleted?: boolean };
  } | null;
}) =>
  response?.data?.owner?.isProfileCompleted ??
  response?.data?.isProfileCompleted;

const goToSelector = (
  email: string,
  password: string,
  phoneNumber?: string,
) => {
  resetTo('tellBusiness', {
    authDraft: {
      email,
      password,
      phoneNumber,
    },
  });
};

const loginErrorMessage = (message?: string, status?: number) =>
  status === 401 ||
  /invalid (email|password|credentials)|incorrect (email|password)/i.test(
    message || '',
  )
    ? 'Incorrect email or password. Please try again, or reset your password.'
    : message || 'Unable to sign in. Please try again.';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFieldErrors = {
  email?: string;
  password?: string;
  phoneNumber?: string;
};

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<LoginFieldErrors>({});
  const login = useAuth(state => state.login);
  const showToast = useToast(state => state.showToast);
  const { authenticateOwner, loading, clearError } = useBusinessOwnerService();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const nextFieldErrors: LoginFieldErrors = {};

    if (!trimmedEmail) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextFieldErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextFieldErrors.password = 'Password is required.';
    }

    const normalizedPhone = phoneNumber.trim();
    if (isSignup && !/^\d{7,10}$/.test(normalizedPhone)) {
      nextFieldErrors.phoneNumber =
        'Mobile number must contain 7 to 10 digits.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('');
      return;
    }

    const continueRegistration = () => {
      if (!/^\d{7,10}$/.test(normalizedPhone)) {
        setIsSignup(true);
        setError('Please add your mobile number to create your account.');
        return;
      }
      goToSelector(trimmedEmail, password, normalizedPhone);
    };

    try {
      setError('');
      setFieldErrors({});
      clearError();
      const response = await authenticateOwner({
        email: trimmedEmail,
        password,
        ...(isSignup ? { phoneNumber: normalizedPhone } : {}),
      });
      const success = isApiSuccess(response.success);
      const owner = response.data?.owner;
      const isProfileCompleted =
        owner?.isProfileCompleted ??
        (response.data as { isProfileCompleted?: boolean } | undefined)
          ?.isProfileCompleted;

      if (success && response.data?.token && owner) {
        login(buildOwnerUser(owner), response.data.token, {
          ownerType: owner.type ?? null,
          isProfileCompleted: owner.isProfileCompleted ?? null,
        });

        if (isProfileCompleted) {
          showToast(response.message || 'Login successful', 'success');
          resetTo('app');
          return;
        }

        if (owner.type === 'SERVICE_PROVIDER') {
          resetTo('BusinessInfoSP', { initialStep: 2 });
          return;
        }

        resetTo('BusinessInfoOwner', { initialStep: 3 });
        return;
      }

      if (isPendingApprovalResponse(response)) {
        setError(PROFILE_REVIEW_MESSAGE);
        return;
      }

      if (isMissingServiceTypeResponse(response)) {
        continueRegistration();
        return;
      }

      if (!success) {
        const failedProfileCompleted = getResponseIsProfileCompleted(response);

        if (failedProfileCompleted === false && response.code !== 401) {
          continueRegistration();
          return;
        }

        setError(loginErrorMessage(response.message, response.code));
        return;
      }

      setError(loginErrorMessage(response.message, response.code));
      showToast(response.message || 'Unable to login.', 'error');
    } catch (err) {
      const responseBody =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as
              | {
                  success?: boolean | string;
                  code?: number;
                  type?: string;
                  message?: string;
                  data?: {
                    isProfileCompleted?: boolean;
                    owner?: { isProfileCompleted?: boolean };
                  } | null;
                }
              | undefined)
          : undefined;

      if (isPendingApprovalResponse(responseBody)) {
        setError(PROFILE_REVIEW_MESSAGE);
        return;
      }

      if (isMissingServiceTypeResponse(responseBody)) {
        continueRegistration();
        return;
      }

      if (responseBody && !isApiSuccess(responseBody.success)) {
        const failedProfileCompleted =
          getResponseIsProfileCompleted(responseBody);

        if (failedProfileCompleted === false && responseBody.code !== 401) {
          continueRegistration();
          return;
        }

        setError(loginErrorMessage(responseBody.message, responseBody.code));
        return;
      }

      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to login.';
      setError(loginErrorMessage(message));
      showToast(message, 'error');
    }
  };

  return (
    <KeyboardWrapper scroll>
      <View style={styles.container}>
        <View>
          <Logo />
        </View>

        <View style={{ marginVertical: 25 }}>
          <PartnerSvg />
        </View>
        <View
          style={{
            // marginTop: vh(10),
            width: 328,
            alignSelf: 'center',
            // backgroundColor: "red"
          }}
        >
          <Text style={[styles.text, { color: colors.text }]}>
            {isSignup ? 'Create Your Account' : 'Welcome Back!'}
          </Text>
          <Text
            style={[
              styles.text,
              {
                color: colors.textMuted,
                fontSize: 14,
                fontWeight: '400',
                lineHeight: 16,
                marginTop: 8,
              },
            ]}
          >
            {isSignup
              ? 'Sign up to become a Raun partner'
              : 'Sign in to continue to your account'}
          </Text>
        </View>

        <View
          style={{
            marginTop: 40,
          }}
        >
          <Loginform
            isSignup={isSignup}
            phoneNumber={phoneNumber}
            phoneError={fieldErrors.phoneNumber}
            onPhoneChange={value => {
              setPhoneNumber(value.replace(/\D/g, '').slice(0, 10));
              setFieldErrors(prev => ({ ...prev, phoneNumber: undefined }));
            }}
            email={email}
            password={password}
            error={error}
            emailError={fieldErrors.email}
            passwordError={fieldErrors.password}
            onEmailChange={value => {
              setEmail(value);
              setError('');
              setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            onPasswordChange={value => {
              setPassword(value);
              setError('');
              setFieldErrors(prev => ({ ...prev, password: undefined }));
            }}
          />
        </View>

        <Button
          title={isSignup ? 'Sign Up' : 'Login'}
          onPress={handleLogin}
          loading={loading}
          // size={'lg'}
          style={{
            width: vw(85),
            backgroundColor: colors.primary,
            marginTop: 20,
          }}
        />
        <TouchableOpacity
          accessibilityRole="button"
          disabled={loading}
          onPress={() => {
            setIsSignup(value => !value);
            setError('');
            setFieldErrors({});
          }}
          style={{ marginTop: 22, padding: 10 }}
        >
          <Text style={{ color: colors.textMuted }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {isSignup ? 'Login' : 'Sign Up'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardWrapper>
  );
}

const Loginform = ({
  isSignup,
  phoneNumber,
  phoneError,
  onPhoneChange,
  email,
  password,
  error,
  emailError,
  passwordError,
  onEmailChange,
  onPasswordChange,
}: {
  isSignup: boolean;
  phoneNumber: string;
  phoneError?: string;
  onPhoneChange: (value: string) => void;
  email: string;
  password: string;
  error?: string;
  emailError?: string;
  passwordError?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) => {
  const [hidepassword, setHidePassword] = useState(true);
  const isUnderReview = error === PROFILE_REVIEW_MESSAGE;

  return (
    <View style={{ width: vw(85) }}>
      <View>
        {isSignup && (
          <InputText
            label="Mobile Number"
            placeholder="Enter mobile number"
            value={phoneNumber}
            onChangeText={onPhoneChange}
            keyboardType="number-pad"
            maxLength={10}
            error={phoneError}
          />
        )}
        <InputText
          placeholder={'Enter Your Email'}
          label={'Email'}
          leftIcon={<EmailSvg />}
          value={email}
          onChangeText={onEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={{ borderRadius: 4 }}
          error={emailError}
        />
        <InputText
          placeholder={'Password'}
          label={'Password'}
          leftIcon={<LockSvg />}
          value={password}
          onChangeText={onPasswordChange}
          secureTextEntry={hidepassword}
          rightIcon={
            <>
              {hidepassword ? (
                <Eye color={colors.textMuted} />
              ) : (
                <EyeOff color={colors.textMuted} />
              )}
            </>
          }
          onRightIconPress={() => {
            setHidePassword(pre => !pre);
          }}
          error={passwordError}
        />
        {error ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.feedbackCard,
              isUnderReview ? styles.reviewCard : styles.failureCard,
            ]}
          >
            <View
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.feedbackIcon,
                isUnderReview ? styles.reviewIcon : styles.failureIcon,
              ]}
            >
              <Text
                style={[
                  styles.feedbackSymbol,
                  isUnderReview ? styles.reviewText : styles.failureText,
                ]}
              >
                {isUnderReview ? '◷' : '!'}
              </Text>
            </View>
            <View style={styles.feedbackCopy}>
              <Text
                style={[
                  styles.feedbackTitle,
                  isUnderReview ? styles.reviewText : styles.failureText,
                ]}
              >
                {isUnderReview
                  ? 'Profile under review'
                  : isSignup
                  ? 'Check your details'
                  : 'Unable to sign in'}
              </Text>
              <Text style={styles.feedbackMessage}>
                {isUnderReview
                  ? 'Our team is reviewing your profile. You can sign in once it’s approved.'
                  : error}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
      {!isSignup && (
        <Text
          accessibilityRole="button"
          onPress={() => navigate('forgotPassword', { email: email.trim() })}
          style={{
            alignSelf: 'flex-end',
            paddingVertical: 12,
            color: colors.secondary,
          }}
        >
          Forgot Password?
        </Text>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.screen,
    alignItems: 'center',
    paddingTop: 130,
    paddingBottom: 100,
    // justifyContent: 'center',
  },
  text: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0.38,
    textAlign: 'center',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  failureCard: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  feedbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewIcon: { backgroundColor: colors.surface },
  failureIcon: { backgroundColor: colors.surface },
  feedbackSymbol: { fontSize: 22, fontWeight: '600' },
  feedbackCopy: { flex: 1 },
  feedbackTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 5,
  },
  feedbackMessage: { fontSize: 14, lineHeight: 21, color: colors.text },
  reviewText: { color: '#805400' },
  failureText: { color: colors.error },
});
