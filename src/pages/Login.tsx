import { StyleSheet, Text, View ,TouchableOpacity} from 'react-native';
import React, { useState } from 'react';
import { colors } from '../styles/theme';
import Logo from '../assets/svg/Code/Logo';
import { EmailSvg, LockSvg } from '../assets/svg';
import { vw } from '../utils/responsive';
import Button from '../components/Button';
import PartnerSvg from '../assets/svg/Code/PartnerSvg';
import { resetTo } from '../navigation/navigationRef';
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
  name: owner.email,
  email: owner.email,
  role: owner.role,
  profileDetails: {
    firstName: '',
    lastName: '',
    phoneNumber: '',
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
  response.message === 'Your profile is pending admin approval' &&
  response.data === null;

const getResponseIsProfileCompleted = (response?: {
  data?: {
    isProfileCompleted?: boolean;
    owner?: { isProfileCompleted?: boolean };
  } | null;
}) =>
  response?.data?.owner?.isProfileCompleted ??
  response?.data?.isProfileCompleted;

const goToSelector = (email: string, password: string) => {
  resetTo('tellBusiness', {
    authDraft: {
      email,
      password,
    },
  });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<LoginFieldErrors>({});
  const login = useAuth(state => state.login);
  const storedIsProfileCompleted = useAuth(state => state.isProfileCompleted);
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

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('');
      return;
    }

    try {
      setError('');
      setFieldErrors({});
      clearError();
      const response = await authenticateOwner({
        email: trimmedEmail,
        password,
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
        setError(response.message || 'Your profile is pending admin approval');
        return;
      }

      if (isMissingServiceTypeResponse(response)) {
        goToSelector(trimmedEmail, password);
        return;
      }

      if (!success) {
        const failedProfileCompleted =
          getResponseIsProfileCompleted(response) ?? storedIsProfileCompleted;

        if (failedProfileCompleted === false) {
          goToSelector(trimmedEmail, password);
          return;
        }

        setError(response.message || 'Unable to login.');
        return;
      }

      setError(response.message || 'Unable to login.');
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
        setError(
          responseBody?.message || 'Your profile is pending admin approval',
        );
        return;
      }

      if (isMissingServiceTypeResponse(responseBody)) {
        goToSelector(trimmedEmail, password);
        return;
      }

      if (responseBody && !isApiSuccess(responseBody.success)) {
        const failedProfileCompleted =
          getResponseIsProfileCompleted(responseBody) ??
          storedIsProfileCompleted;

        if (failedProfileCompleted === false) {
          goToSelector(trimmedEmail, password);
          return;
        }

        setError(responseBody.message || 'Unable to login.');
        return;
      }

      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to login.';
      setError(message);
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
            Welcome Back!
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
            Sign in to continue to your account{' '}
          </Text>
        </View>

        <View
          style={{
            marginTop: 40,
          }}
        >
          <Loginform
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
          title={'Login '}
          onPress={handleLogin}
          loading={loading}
          // size={'lg'}
          style={{
            width: vw(85),
            backgroundColor: colors.primary,
            marginTop: 20,
          }}
        />
      </View>
    </KeyboardWrapper>
  );
}

const Loginform = ({
  email,
  password,
  error,
  emailError,
  passwordError,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  error?: string;
  emailError?: string;
  passwordError?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) => {
  const [hidepassword, setHidePassword] = useState(true);

  return (
    <View style={{ width: vw(85) }}>
      <View>
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
      {/* <TouchableOpacity>
        <Text
          style={{
            alignSelf: 'flex-end',
            marginVertical: 10,
            color: colors.secondary,
            fontSize: 12,
          }}
        >
          Forgot Password?
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -6,
    marginBottom: 6,
  },
});
