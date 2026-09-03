import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImagePickerResponse } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import CommonHeader from '../components/CommonHeader';
import ImagePickerModal from '../components/PickImage';
import InputText from '../components/InputText';
import KeyboardWrapper from '../components/KeyboardWrapper';
import Select from '../components/Select';
import MapView, { type MapCoordinates } from '../components/Map';
import CameraSvg from '../assets/svg/Code/CameraSvg';
import { navigate } from '../navigation/navigationRef';
import { colors } from '../styles/theme';
import { scale, vh } from '../utils/responsive';
import type { RootStackParamList } from '../navigation';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import {
  isApiSuccess,
  useBusinessOwnerService,
  type BusinessOwner,
  type BusinessHourPayload,
  type UploadFile,
} from '../services/businessOwnerService';

type Step = 1 | 2 | 3 | 4;
type Props = NativeStackScreenProps<RootStackParamList, 'BusinessInfoOwner'>;
type PickerTarget =
  | 'businessPhoto'
  | 'tradeLicense'
  | 'fssaiCertificate'
  | 'idProof'
  | null;

type BusinessForm = {
  businessPhoto: UploadFile | null;
  businessName: string;
  cuisineType: string;
  businessType: string;
};

type LocationForm = {
  address: string;
  area: string;
  city: string;
  pinCode: string;
  coordinates: MapCoordinates | null;
};

type DayHours = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

type DocumentForm = {
  tradeLicense: UploadFile | null;
  fssaiCertificate: UploadFile | null;
  idProof: UploadFile | null;
};

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

const STEP_META: Record<Step, { title: string; subtitle: string }> = {
  1: {
    title: 'Add Business Details',
    subtitle: 'Basic Information about your business',
  },
  2: {
    title: 'Location Details',
    subtitle: 'Where is your business located',
  },
  3: {
    title: 'Business Hours',
    subtitle: 'Set Your Business Hours',
  },
  4: {
    title: 'Documents',
    subtitle: 'Upload Your Documents',
  },
};

const CUISINE_OPTIONS = [
  { label: 'Indian', value: 'Indian' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Chinese', value: 'Chinese' },
];

const BUSINESS_TYPE_OPTIONS = [
  { label: 'Restaurant', value: 'Restaurant' },
  { label: 'Cafe', value: 'Cafe' },
  { label: 'Bakery', value: 'Bakery' },
  { label: 'Food Truck', value: 'Food Truck' },
];

const CITY_OPTIONS = [
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Sharjah', value: 'Sharjah' },
  { label: 'Ajman', value: 'Ajman' },
];

const DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const TIME_OPTIONS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

const DEFAULT_HOURS: Record<string, DayHours> = {
  MONDAY: { enabled: true, openTime: '09:00', closeTime: '22:00' },
  TUESDAY: { enabled: true, openTime: '09:00', closeTime: '22:00' },
  WEDNESDAY: { enabled: true, openTime: '09:00', closeTime: '22:00' },
  THURSDAY: { enabled: true, openTime: '09:00', closeTime: '22:00' },
  FRIDAY: { enabled: true, openTime: '09:00', closeTime: '23:00' },
  SATURDAY: { enabled: true, openTime: '10:00', closeTime: '23:00' },
  SUNDAY: { enabled: false, openTime: '', closeTime: '' },
};

export default function BusinessInfoOwner({ route }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(
    route.params?.initialStep || 1,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const login = useAuth(state => state.login);
  const showToast = useToast(state => state.showToast);
  const {
    authenticateOwner,
    updateBusinessHours,
    updateBusinessDocuments,
    loading,
    clearError,
  } = useBusinessOwnerService();

  const [businessForm, setBusinessForm] = useState<BusinessForm>({
    businessPhoto: null,
    businessName: '',
    cuisineType: '',
    businessType: '',
  });

  const [locationForm, setLocationForm] = useState<LocationForm>({
    address: '',
    area: '',
    city: '',
    pinCode: '',
    coordinates: null,
  });

  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);
  const [timePicker, setTimePicker] = useState<{
    visible: boolean;
    day: string;
    field: 'openTime' | 'closeTime';
  }>({ visible: false, day: '', field: 'openTime' });

  const [documents, setDocuments] = useState<DocumentForm>({
    tradeLicense: null,
    fssaiCertificate: null,
    idProof: null,
  });

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    const asset = response.assets?.[0];
    const uri = asset?.uri;
    if (!uri || !pickerTarget) return;

    const selectedFile: UploadFile = {
      uri,
      name: asset.fileName,
      type: asset.type,
    };

    if (pickerTarget === 'businessPhoto') {
      setBusinessForm(prev => ({ ...prev, businessPhoto: selectedFile }));
    } else {
      setDocuments(prev => ({ ...prev, [pickerTarget]: selectedFile }));
    }
  };

  const buildBusinessHoursPayload = (): BusinessHourPayload[] =>
    DAYS.map(day => {
      const dayHours = hours[day];
      const isClosed = !dayHours.enabled;

      return {
        day,
        isClosed,
        openTime: isClosed ? '' : dayHours.openTime,
        closeTime: isClosed ? '' : dayHours.closeTime,
      };
    });

  const handleBusinessAuthSubmit = async () => {
    const authDraft = route.params?.authDraft;

    if (!authDraft?.email || !authDraft.password) {
      showToast('Please login again before completing onboarding.', 'error');
      navigate('login');
      return;
    }

    if (
      !businessForm.businessName ||
      !businessForm.cuisineType ||
      !businessForm.businessType ||
      !businessForm.businessPhoto ||
      !locationForm.address ||
      !locationForm.area ||
      !locationForm.city ||
      !locationForm.pinCode ||
      !locationForm.coordinates
    ) {
      showToast('Please complete all business and location details.', 'error');
      return;
    }

    try {
      clearError();
      const response = await authenticateOwner({
        email: authDraft.email,
        password: authDraft.password,
        type: authDraft.type,
        businessPhoto: businessForm.businessPhoto,
        businessName: businessForm.businessName,
        cuisineType: businessForm.cuisineType,
        businessType: businessForm.businessType,
        address: locationForm.address,
        area: locationForm.area,
        city: locationForm.city,
        pinCode: locationForm.pinCode,
        location: {
          type: 'Point',
          coordinates: [
            locationForm.coordinates.longitude,
            locationForm.coordinates.latitude,
          ],
        },
      });

      if (
        isApiSuccess(response.success) &&
        response.data?.token &&
        response.data.owner
      ) {
        login(buildOwnerUser(response.data.owner), response.data.token, {
          ownerType: response.data.owner.type ?? null,
          isProfileCompleted: response.data.owner.isProfileCompleted ?? null,
        });
        setCurrentStep(3);
        return;
      }

      showToast(
        response.message || 'Unable to save business details.',
        'error',
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to save business details.';
      showToast(message, 'error');
    }
  };

  const handleHoursSubmit = async () => {
    try {
      clearError();
      const response = await updateBusinessHours(buildBusinessHoursPayload());

      if (!isApiSuccess(response.success)) {
        showToast(
          response.message || 'Unable to save business hours.',
          'error',
        );
        return;
      }

      setCurrentStep(4);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to save business hours.';
      showToast(message, 'error');
    }
  };

  const handleDocumentsSubmit = async () => {
    if (
      !documents.tradeLicense ||
      !documents.fssaiCertificate ||
      !documents.idProof
    ) {
      showToast('Please upload all required documents.', 'error');
      return;
    }

    try {
      clearError();
      const response = await updateBusinessDocuments(documents);

      if (!isApiSuccess(response.success)) {
        showToast(response.message || 'Unable to upload documents.', 'error');
        return;
      }

      navigate('ProfileUnderReview');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to upload documents.';
      showToast(message, 'error');
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      handleBusinessAuthSubmit();
      return;
    }

    if (currentStep === 3) {
      handleHoursSubmit();
      return;
    }

    handleDocumentsSubmit();
  };

  const toggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const setTime = (time: string) => {
    setHours(prev => ({
      ...prev,
      [timePicker.day]: {
        ...prev[timePicker.day],
        [timePicker.field]: time,
      },
    }));
    setTimePicker({ visible: false, day: '', field: 'openTime' });
  };

  return (
    <View style={styles.container}>
      <CommonHeader
        useSafeAreaTop
        children={
          <View style={styles.headerContent}>
            <Text style={styles.heading}>{STEP_META[currentStep].title}</Text>
            <Text style={styles.subHeading}>
              {STEP_META[currentStep].subtitle}
            </Text>
            <OwnerStepper currentStep={currentStep} />
          </View>
        }
      />

      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onChange={handlePickerResult}
      />

      <KeyboardWrapper scroll keyboardVerticalOffset={60}>
        <View style={styles.content}>
          {currentStep === 1 && (
            <BusinessDetailsStep
              form={businessForm}
              onFormChange={(field, value) =>
                setBusinessForm(prev => ({ ...prev, [field]: value }))
              }
              onPickPhoto={() => openPicker('businessPhoto')}
            />
          )}

          {currentStep === 2 && (
            <LocationDetailsStep
              form={locationForm}
              onFormChange={(field, value) =>
                setLocationForm(prev => ({ ...prev, [field]: value }))
              }
              onCoordinatesChange={coordinates =>
                setLocationForm(prev => ({ ...prev, coordinates }))
              }
            />
          )}

          {currentStep === 3 && (
            <BusinessHoursStep
              hours={hours}
              onToggleDay={toggleDay}
              onOpenTimePicker={(day, field) =>
                setTimePicker({ visible: true, day, field })
              }
            />
          )}

          {currentStep === 4 && (
            <DocumentsStep documents={documents} onPickDocument={openPicker} />
          )}

          <Button
            title={currentStep === 4 ? 'Submit For Review' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            fullWidth
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
        </View>
      </KeyboardWrapper>

      {timePicker.visible && (
        <View style={styles.timeSheet}>
          <Text style={styles.timeSheetTitle}>
            Select {timePicker.field === 'openTime' ? 'Opening' : 'Closing'}{' '}
            Time
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map(time => (
              <TouchableOpacity
                key={time}
                activeOpacity={0.75}
                style={styles.timeOption}
                onPress={() => setTime(time)}
              >
                <Text style={styles.timeOptionText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cancelTimeButton}
            onPress={() =>
              setTimePicker({ visible: false, day: '', field: 'openTime' })
            }
          >
            <Text style={styles.cancelTimeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function OwnerStepper({ currentStep }: { currentStep: Step }) {
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperTrack}>
        <View
          style={[styles.stepperFill, { width: `${(currentStep / 4) * 100}%` }]}
        />
      </View>
      <View style={styles.stepperTrack} />
    </View>
  );
}

function UploadBox({
  label,
  uri,
  onPress,
  large = false,
}: {
  label: string;
  uri?: string | null;
  onPress: () => void;
  large?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.uploadBox, large && styles.photoUploadBox]}
      onPress={onPress}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.uploadPreview} />
      ) : (
        <View style={styles.uploadPlaceholder}>
          <View style={styles.uploadIconCircle}>
            <CameraSvg width={15} height={13} color={colors.textLight} />
          </View>
          <Text style={styles.uploadLabel}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function BusinessDetailsStep({
  form,
  onFormChange,
  onPickPhoto,
}: {
  form: BusinessForm;
  onFormChange: (
    field: Exclude<keyof BusinessForm, 'businessPhoto'>,
    value: string,
  ) => void;
  onPickPhoto: () => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Business Photo</Text>
      <UploadBox
        label="Photos"
        uri={form.businessPhoto?.uri}
        onPress={onPickPhoto}
        large
      />

      <InputText
        label="Business Name"
        placeholder="Enter Business Name"
        value={form.businessName}
        onChangeText={value => onFormChange('businessName', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
        inputStyle={styles.inputText}
      />
      <Select
        label="Cuisine Type"
        placeholder=""
        options={CUISINE_OPTIONS}
        value={form.cuisineType}
        onChange={value => onFormChange('cuisineType', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
      />
      <Select
        label="Business Type"
        placeholder=""
        options={BUSINESS_TYPE_OPTIONS}
        value={form.businessType}
        onChange={value => onFormChange('businessType', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
      />
    </View>
  );
}

function LocationDetailsStep({
  form,
  onFormChange,
  onCoordinatesChange,
}: {
  form: LocationForm;
  onFormChange: (
    field: Exclude<keyof LocationForm, 'coordinates'>,
    value: string,
  ) => void;
  onCoordinatesChange: (coordinates: MapCoordinates) => void;
}) {
  return (
    <View>
      <InputText
        label="Address"
        placeholder="Enter Complete Address"
        value={form.address}
        onChangeText={value => onFormChange('address', value)}
        containerStyle={styles.inputField}
        labelStyle={styles.compactLabel}
        inputStyle={styles.inputText}
      />
      <InputText
        label="Area"
        placeholder="Enter Area"
        value={form.area}
        onChangeText={value => onFormChange('area', value)}
        containerStyle={styles.inputField}
        labelStyle={styles.compactLabel}
        inputStyle={styles.inputText}
      />
      <View style={styles.locationRow}>
        <View style={styles.locationHalf}>
          <Select
            label="City"
            placeholder="Select City"
            options={CITY_OPTIONS}
            value={form.city}
            onChange={value => onFormChange('city', value)}
            labelStyle={styles.compactLabel}
          />
        </View>
        <View style={styles.locationHalf}>
          <InputText
            label="Pin Code"
            placeholder="Enter Pin code"
            value={form.pinCode}
            onChangeText={value => onFormChange('pinCode', value)}
            keyboardType="number-pad"
            labelStyle={styles.compactLabel}
            inputStyle={styles.inputText}
          />
        </View>
      </View>

      <View style={styles.mapBox}>
        <MapView
          selectedCoordinates={form.coordinates}
          onSelectCoordinates={onCoordinatesChange}
          showSelectedLabel
        />
      </View>
    </View>
  );
}

function BusinessHoursStep({
  hours,
  onToggleDay,
  onOpenTimePicker,
}: {
  hours: Record<string, DayHours>;
  onToggleDay: (day: string) => void;
  onOpenTimePicker: (day: string, field: 'openTime' | 'closeTime') => void;
}) {
  return (
    <View style={styles.hoursList}>
      {DAYS.map(day => {
        const config = hours[day];
        return (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayName}>{day}</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.timeBox}
              onPress={() => onOpenTimePicker(day, 'openTime')}
            >
              <Text style={styles.timeText}>{config.openTime}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>to</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.timeBox}
              onPress={() => onOpenTimePicker(day, 'closeTime')}
            >
              <Text style={styles.timeText}>{config.closeTime}</Text>
            </TouchableOpacity>
            <Switch
              value={config.enabled}
              onValueChange={() => onToggleDay(day)}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor={colors.textLight}
              ios_backgroundColor={colors.borderDark}
              style={styles.switch}
            />
          </View>
        );
      })}
    </View>
  );
}

function DocumentsStep({
  documents,
  onPickDocument,
}: {
  documents: DocumentForm;
  onPickDocument: (target: PickerTarget) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Trade License</Text>
      <UploadBox
        label="Upload"
        uri={documents.tradeLicense?.uri}
        onPress={() => onPickDocument('tradeLicense')}
      />

      <Text style={styles.fieldLabel}>FSSAI Certificate</Text>
      <UploadBox
        label="Upload"
        uri={documents.fssaiCertificate?.uri}
        onPress={() => onPickDocument('fssaiCertificate')}
      />

      <Text style={styles.fieldLabel}>ID Proof</Text>
      <UploadBox
        label="Upload"
        uri={documents.idProof?.uri}
        onPress={() => onPickDocument('idProof')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screen,
  },
  headerContent: {
    paddingBottom: 18,
  },
  heading: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  subHeading: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  stepper: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  stepperTrack: {
    flex: 1,
    height: 5,
    borderRadius: 8,
    backgroundColor: colors.textLight,
    overflow: 'hidden',
  },
  stepperFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 84,
  },
  fieldLabel: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  compactLabel: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputField: {
    marginBottom: 18,
  },
  inputText: {
    fontSize: 12,
    paddingVertical: 9,
  },
  fieldSpacing: {
    marginBottom: 22,
  },
  uploadBox: {
    height: scale(90),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'hidden',
  },
  photoUploadBox: {
    height: scale(94),
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 24,
  },
  locationHalf: {
    flex: 1,
  },
  mapBox: {
    height: vh(24),
    minHeight: 190,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    position: 'relative',
  },
  hoursList: {
    paddingTop: 18,
  },
  dayRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    flex: 1,
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '500',
  },
  timeBox: {
    width: 68,
    height: 38,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  timeSeparator: {
    width: 22,
    textAlign: 'center',
    color: colors.textDark,
    fontSize: 12,
  },
  switch: {
    marginLeft: 12,
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  continueButton: {
    height: 47,
    borderRadius: 7,
    backgroundColor: colors.primary,
    marginTop: 'auto',
  },
  continueButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: vh(58),
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 16,
  },
  timeSheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeOption: {
    paddingVertical: 9,
    alignItems: 'center',
  },
  timeOptionText: {
    color: colors.text,
    fontSize: 14,
  },
  cancelTimeButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  cancelTimeText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
