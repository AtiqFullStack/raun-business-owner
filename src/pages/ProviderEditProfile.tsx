import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  currencyLabel,
  isSupportedCurrency,
} from '../utils/currency';
import Select from '../components/Select';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import type { AccountStackParamList } from '../routes/TabNavigation';
import CommonHeader from '../components/CommonHeader';
import KeyboardWrapper from '../components/KeyboardWrapper';
import OwnerAvailability from '../components/OwnerAvailability';
import {
  defaultAvailability,
  availabilityError,
} from '../utils/ownerAvailability';
import useOwnerProfile from '../hooks/useOwnerProfile';
import {
  availabilityLabels,
  useOwnerProfileService,
  type OwnerProfile,
} from '../services/ownerProfileService';
import type { UploadFile } from '../services/businessOwnerService';
import { bookingError } from '../hooks/useDemandBookings';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import getImageUrl from '../utils/urlConvertor';
type Props = NativeStackScreenProps<AccountStackParamList, 'EditProfile'>;

export default function ProviderEditProfile({ navigation }: Props) {
  const { profile, loading, error, refresh } = useOwnerProfile();
  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <CommonHeader
          title="Edit profile"
          backgroundColor="#164C48"
          titleStyle={styles.headerTitle}
          horizontalPadding={18}
          topPadding={10}
          bottomPadding={16}
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.back}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
          }
        />
        {loading && !profile ? (
          <ActivityIndicator color="#164C48" style={styles.loading} />
        ) : profile ? (
          <ProfileForm
            key={profile._id}
            profile={profile}
            onDone={() => navigation.goBack()}
          />
        ) : (
          <View style={styles.loading}>
            <Text style={styles.error}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.retry}
              onPress={refresh}
            >
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardWrapper>
  );
}
function ProfileForm({
  profile,
  onDone,
}: {
  profile: OwnerProfile;
  onDone: () => void;
}) {
  const { updateProfile } = useOwnerProfileService({
    showLoader: true,
    loaderText: 'Saving profile...',
  });
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    professionalTitle:
      profile.professionalTitle || profile.serviceType?.name || '',
    about: profile.about || '',
    languages: (profile.languages || []).join(', '),
    currency: profile.currency || DEFAULT_CURRENCY,
    hourlyRate: profile.hourlyRate?.toString() || '',
    serviceCallCharge: profile.serviceCallCharge?.toString() || '0',
    minimumCharge: profile.minimumCharge?.toString() || '0',
    availabilityPreference: profile.availabilityPreference || '',
  });
  const [schedule, setSchedule] = useState(
    profile.availabilitySchedule?.length
      ? profile.availabilitySchedule
      : defaultAvailability(profile.availabilityPreference || 'FULL_TIME'),
  );
  const [timezone, setTimezone] = useState(
    (profile.availabilitySchedule?.length && profile.availabilityTimezone) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC',
  );
  const [photo, setPhoto] = useState<UploadFile>();
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const busy = useRef(false),
    mounted = useRef(true);
  const ownerId = useAuth(state => state.user?.id),
    token = useAuth(state => state.token);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const uri = photo?.uri || getImageUrl(profile.profilePhoto);
  const change = (key: keyof typeof form, value: string) => {
    setForm(previous => ({ ...previous, [key]: value }));
    if (key === 'availabilityPreference' && value !== 'FLEXIBLE')
      setSchedule(defaultAvailability(value));
    setErrors(previous => ({ ...previous, [key]: '' }));
  };
  const pickPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (!mounted.current || result.didCancel) return;
      const asset = result.assets?.[0];
      if (result.errorCode || !asset?.uri)
        throw new Error(result.errorMessage || 'Please choose a valid photo.');
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
        throw new Error('Photo must be 5 MB or less.');
      setPhoto({
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.type || 'image/jpeg',
      });
      setError('');
    } catch (err) {
      if (mounted.current) setError(bookingError(err));
    }
  };
  const save = async () => {
    if (busy.current) return;
    const invalid: Record<string, string> = {};
    if (form.fullName.trim().length < 2)
      invalid.fullName = 'Enter your full name.';
    if (form.professionalTitle.trim().length < 2)
      invalid.professionalTitle = 'Enter your professional title.';
    const languages = form.languages
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    if (
      !languages.length ||
      languages.length > 15 ||
      languages.some(value => value.length > 50)
    )
      invalid.languages = 'Enter 1–15 languages, separated by commas.';
    for (const key of [
      'hourlyRate',
      'serviceCallCharge',
      'minimumCharge',
    ] as const) {
      const amount = Number(form[key]);
      if (
        !form[key].trim() ||
        !Number.isFinite(amount) ||
        amount < (key === 'hourlyRate' ? 0.01 : 0) ||
        amount > 1000000
      )
        invalid[key] =
          key === 'hourlyRate'
            ? 'Enter a rate greater than zero.'
            : 'Enter a valid amount (zero is allowed).';
    }
    if (!availabilityLabels[form.availabilityPreference])
      invalid.availabilityPreference = 'Choose your availability.';
    if (!isSupportedCurrency(form.currency))
      invalid.currency = 'Please select a valid currency.';
    const scheduleError = availabilityError(schedule);
    if (scheduleError) invalid.availabilitySchedule = scheduleError;
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setError('Please check the highlighted fields.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const result = await updateProfile({
        fullName: form.fullName.trim(),
        professionalTitle: form.professionalTitle.trim(),
        about: form.about.trim(),
        languages,
        currency: form.currency,
        hourlyRate: Number(form.hourlyRate),
        serviceCallCharge: Number(form.serviceCallCharge),
        minimumCharge: Number(form.minimumCharge),
        availabilityPreference: form.availabilityPreference,
        availabilitySchedule: schedule,
        availabilityTimezone: timezone,
        profilePhoto: photo,
      });
      if (
        !mounted.current ||
        useAuth.getState().user?.id !== ownerId ||
        useAuth.getState().token !== token
      )
        return;
      if (result._id !== ownerId)
        throw new Error('Unable to update this account.');
      const user = useAuth.getState().user;
      if (user)
        useAuth.setState({
          user: {
            ...user,
            name: result.fullName,
            profileDetails: {
              ...user.profileDetails,
              firstName: result.fullName.split(/\s+/)[0],
              lastName: result.fullName.split(/\s+/).slice(1).join(' '),
              profileImage: result.profilePhoto,
            },
          },
        });
      useToast.getState().showToast('Profile updated successfully.', 'success');
      onDone();
    } catch (err) {
      if (mounted.current && useAuth.getState().user?.id === ownerId)
        setError(bookingError(err));
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  return (
    <ScrollView
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.photoSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {(form.fullName.trim()[0] || 'P').toUpperCase()}
          </Text>
          {uri && uri !== failedPhoto && (
            <Image
              source={{ uri }}
              onError={() => setFailedPhoto(uri)}
              style={styles.photo}
            />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={pickPhoto}
          style={styles.photoButton}
        >
          <Camera size={15} color="#164C48" />
          <Text style={styles.photoLabel}>Change photo</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal details</Text>
        <Field
          label="Full name"
          value={form.fullName}
          onChangeText={value => change('fullName', value)}
          error={errors.fullName}
          maxLength={100}
        />
        <Field
          label="Professional title"
          value={form.professionalTitle}
          onChangeText={value => change('professionalTitle', value)}
          error={errors.professionalTitle}
          maxLength={100}
        />
        <Text style={styles.fieldLabel}>Sign-in email</Text>
        <Text style={styles.readonly}>{profile.email}</Text>
        <Field
          label="About you"
          value={form.about}
          onChangeText={value => change('about', value)}
          multiline
          maxLength={2000}
          placeholder="Tell customers about your work"
        />
        <Field
          label="Languages"
          value={form.languages}
          onChangeText={value => change('languages', value)}
          error={errors.languages}
          placeholder="English, Hindi"
          maxLength={750}
        />
        <Text style={styles.hint}>Separate each language with a comma.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rates & availability</Text>
        <Text style={styles.hint}>
          Rates apply to new bookings. Existing bookings keep their agreed
          price.
        </Text>
        <Select
          label="Currency"
          searchable
          options={CURRENCY_OPTIONS}
          value={form.currency}
          onChange={value => change('currency', value)}
          error={errors.currency}
        />
        <Field
          label={`Hourly rate (${currencyLabel(form.currency)})`}
          value={form.hourlyRate}
          keyboardType="decimal-pad"
          onChangeText={value => change('hourlyRate', value)}
          error={errors.hourlyRate}
          maxLength={12}
        />
        <Field
          label={`Call-out charge (${currencyLabel(form.currency)})`}
          value={form.serviceCallCharge}
          keyboardType="decimal-pad"
          onChangeText={value => change('serviceCallCharge', value)}
          error={errors.serviceCallCharge}
          maxLength={12}
        />
        <Field
          label={`Minimum charge (${currencyLabel(form.currency)})`}
          value={form.minimumCharge}
          keyboardType="decimal-pad"
          onChangeText={value => change('minimumCharge', value)}
          error={errors.minimumCharge}
          maxLength={12}
        />
        <Text style={styles.fieldLabel}>Availability</Text>
        <View style={styles.options}>
          {Object.entries(availabilityLabels).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{
                checked: form.availabilityPreference === key,
              }}
              onPress={() => change('availabilityPreference', key)}
              style={[
                styles.option,
                form.availabilityPreference === key && styles.selected,
              ]}
            >
              {form.availabilityPreference === key && (
                <Check size={13} color="#164C48" />
              )}
              <Text
                style={[
                  styles.optionText,
                  form.availabilityPreference === key && styles.selectedText,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <OwnerAvailability
          value={schedule}
          onChange={setSchedule}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          error={errors.availabilitySchedule}
        />
        {!!errors.availabilityPreference && (
          <Text style={styles.error}>{errors.availabilityPreference}</Text>
        )}
      </View>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        disabled={saving}
        onPress={save}
        style={[styles.save, saving && styles.disabled]}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveLabel}>Save changes</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
function Field({
  label,
  error,
  multiline,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9AA99D"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          !!error && styles.invalid,
        ]}
        {...props}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 18, paddingBottom: 116, gap: 16 },
  loading: { padding: 35, gap: 15 },
  retry: { alignSelf: 'center', padding: 15 },
  retryLabel: { color: '#C26D35', fontWeight: '600' },
  photoSection: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#E4EEE6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { position: 'absolute', width: 80, height: 80 },
  initials: { color: '#547861', fontSize: 30, fontWeight: '600' },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: '#EAF1EB',
  },
  photoLabel: { color: '#164C48', fontSize: 12, fontWeight: '500' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EBE6',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    color: '#294D3A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  fieldLabel: {
    color: '#6D8373',
    fontSize: 12,
    marginTop: 17,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    color: '#294D3A',
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#DFE8DF',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    fontSize: 13,
    paddingVertical: 11,
  },
  multiline: { minHeight: 110, lineHeight: 20 },
  readonly: { color: '#8A998C', paddingVertical: 13, fontSize: 13 },
  hint: { color: '#91A091', fontSize: 11, lineHeight: 18, marginTop: 7 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#DFE8DF',
    borderRadius: 9,
  },
  selected: { backgroundColor: '#ECF5EC', borderColor: '#8FB39B' },
  optionText: { color: '#8A998C', fontSize: 12 },
  selectedText: { color: '#164C48', fontWeight: '500' },
  error: { color: '#B75739', fontSize: 12, lineHeight: 18 },
  fieldError: { color: '#B75739', fontSize: 11, marginTop: 6 },
  invalid: { borderColor: '#D98B73' },
  save: {
    backgroundColor: '#164C48',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  saveLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
