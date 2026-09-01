import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path } from 'react-native-svg';
import CommonHeader from '../components/CommonHeader';
import type { AccountStackParamList } from '../routes/TabNavigation';
import {
  type ProfileImagePayload,
  useAuthService,
} from '../services/authService';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import { colors } from '../styles/theme';
import BackSvg from '../assets/svg/Code/BackSvg';
import type { UserProfileDetails } from '../types/auth';

import getImageUrl from '../utils/urlConvertor';

type Props = NativeStackScreenProps<AccountStackParamList, 'EditProfile'>;

type ProfileForm = Omit<UserProfileDetails, 'role'>;
const maxProfileImageSize = 5 * 1024 * 1024;



export default function EditProfile({ navigation }: Props) {
  const user = useAuth(state => state.user);
  const updateUserProfile = useAuth(state => state.updateUserProfile);
  const showToast = useToast(state => state.showToast);
  const { updateProfile, loading } = useAuthService();

  const initialForm = useMemo(() => {
    if (user?.profileDetails) {
      const { firstName, lastName, phoneNumber, email, profileImage } =
        user.profileDetails;

      return {
        firstName,
        lastName,
        phoneNumber,
        email,
        profileImage,
      };
    }

    const [firstName = 'Abdul', ...rest] = (user?.name || 'Abdul Hamid').split(
      ' ',
    );

    return {
      firstName,
      lastName: rest.join(' ') || 'Hamid',
      phoneNumber: '+637 258 888 8888',
      email: user?.email || 'abu@gmail.com',
    };
  }, [user?.email, user?.name, user?.profileDetails]);

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [selectedImage, setSelectedImage] =
    useState<ProfileImagePayload | null>(null);

  const avatarUri = selectedImage?.uri || getImageUrl(form.profileImage);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showToast(result.errorMessage || 'Failed to pick image.', 'error');
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        showToast('Please select a valid image.', 'error');
        return;
      }

      if (asset.fileSize && asset.fileSize > maxProfileImageSize) {
        showToast('Image size must be 5 MB or less.', 'error');
        return;
      }

      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    } catch {
      showToast('Failed to pick image.', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        profileImage: selectedImage ?? undefined,
      });

      const profileDetails = response.data.user.profileDetails;

      updateUserProfile({
        firstName: profileDetails?.firstName || form.firstName.trim(),
        lastName: profileDetails?.lastName || form.lastName.trim(),
        phoneNumber: profileDetails?.phoneNumber || form.phoneNumber.trim(),
        email: profileDetails?.email || form.email.trim(),
        role: profileDetails?.role || 'user',
        profileImage: profileDetails?.profileImage,
      });

      showToast(response.message || 'Profile updated successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to update profile.';

      showToast(message, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <CommonHeader
        left={
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
          >
            <BackSvg />
          </Pressable>
        }
        title="Edit Profile"
        bottomPadding={18}
        containerStyle={styles.header}
        horizontalPadding={16}
        rowStyle={styles.headerRow}
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarFrame}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <ProfileAvatarIcon />
              )}
            </View>
            <Pressable
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleSelectImage}
              style={styles.editPhotoButton}
            >
              <EditIcon />
            </Pressable>
          </View>

          <ProfileInput
            label="First Name"
            onChangeText={value => updateField('firstName', value)}
            value={form.firstName}
          />
          <ProfileInput
            label="Last Name"
            onChangeText={value => updateField('lastName', value)}
            value={form.lastName}
          />
          <ProfileInput
            keyboardType="phone-pad"
            label="Phone Number"
            onChangeText={value => updateField('phoneNumber', value)}
            value={form.phoneNumber}
          />
          <ProfileInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email Address"
            onChangeText={value => updateField('email', value)}
            value={form.email}
          />

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={handleUpdate}
            style={({ pressed }) => [
              styles.updateButton,
              pressed && styles.updateButtonPressed,
              loading && styles.updateButtonDisabled,
            ]}
          >
            <Text style={styles.updateText}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileInput({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.55)"
        selectionColor={colors.primary}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

function EditIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="m4 16.8-.7 3.9 3.9-.7L18.8 8.4l-3.2-3.2L4 16.8Z"
        fill={colors.textLight}
      />
      <Path
        d="m14.7 6.1 3.2 3.2"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function ProfileAvatarIcon() {
  return (
    <Svg width={76} height={76} viewBox="0 0 76 76" fill="none">
      <Path
        d="M38 76C58.9868 76 76 58.9868 76 38C76 17.0132 58.9868 0 38 0C17.0132 0 0 17.0132 0 38C0 58.9868 17.0132 76 38 76Z"
        fill="#4057FF"
      />
      <Path
        d="M51.6 55.9C47.9 58.5 43.2 60 38 60C32.8 60 28.1 58.5 24.4 55.9C25 49.9 29.4 45.4 35.1 44.1V40.5C32.8 38.9 31.3 35.8 31.3 32.3C31.3 26.9 34.3 23 38 23C41.7 23 44.7 26.9 44.7 32.3C44.7 35.8 43.2 38.9 40.9 40.5V44.1C46.6 45.4 51 49.9 51.6 55.9Z"
        fill={colors.textLight}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: {
    justifyContent: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  content: {
    paddingBottom: 116,
    paddingHorizontal: 18,
    paddingTop: 90,
  },
  formCard: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
    minHeight: 450,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 66,
  },
  avatarContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 120,
    justifyContent: 'center',
    position: 'absolute',
    top: -60,
    width: 120,
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: colors.textLight,
    borderRadius: 60,
    elevation: 4,
    height: 120,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 120,
  },
  avatarImage: {
    borderRadius: 51,
    height: 102,
    resizeMode: 'cover',
    width: 102,
  },
  editPhotoButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 8,
    width: 26,
  },
  field: {
    marginBottom: 18,
  },
  inputLabel: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 7,
  },
  input: {
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 5,
    borderWidth: 1,
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '500',
    height: 46,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  updateButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 46,
    justifyContent: 'center',
    marginTop: 14,
  },
  updateButtonPressed: {
    opacity: 0.78,
  },
  updateButtonDisabled: {
    opacity: 0.68,
  },
  updateText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
});
