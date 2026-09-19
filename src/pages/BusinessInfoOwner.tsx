import React, { useEffect, useState } from 'react';
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

type BusinessFormErrors = Partial<Record<keyof BusinessForm, string>>;
type LocationFormErrors = Partial<Record<keyof LocationForm, string>>;
type HoursFormErrors = Partial<
  Record<string, Partial<Record<'openTime' | 'closeTime', string>>>
>;
type DocumentFormErrors = Partial<Record<keyof DocumentForm, string>>;

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

const CITY_OPTIONS = [
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Sharjah', value: 'Sharjah' },
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

const isBlank = (value: string) => value.trim() === '';

const validateBusinessDetails = (form: BusinessForm) => {
  const errors: BusinessFormErrors = {};

  if (!form.businessPhoto) {
    errors.businessPhoto = 'Please upload a business photo.';
  }
  if (isBlank(form.businessName)) {
    errors.businessName = 'Please enter business name.';
  }
  if (isBlank(form.cuisineType)) {
    errors.cuisineType = 'Please select cuisine type.';
  }
  if (isBlank(form.businessType)) {
    errors.businessType = 'Please select business type.';
  }

  return errors;
};

const validateLocationDetails = (form: LocationForm) => {
  const errors: LocationFormErrors = {};

  if (isBlank(form.address)) {
    errors.address = 'Please enter complete address.';
  }
  if (isBlank(form.area)) {
    errors.area = 'Please enter area.';
  }
  if (isBlank(form.city)) {
    errors.city = 'Please select city.';
  }
  if (isBlank(form.pinCode)) {
    errors.pinCode = 'Please enter pin code.';
  }
  if (!form.coordinates) {
    errors.coordinates = 'Please select location on map.';
  }

  return errors;
};

const validateBusinessHours = (businessHours: Record<string, DayHours>) => {
  const errors: HoursFormErrors = {};
  const hasOpenDay = DAYS.some(day => businessHours[day].enabled);

  DAYS.forEach(day => {
    const dayHours = businessHours[day];

    if (!dayHours.enabled) return;

    const dayErrors: Partial<Record<'openTime' | 'closeTime', string>> = {};

    if (isBlank(dayHours.openTime)) {
      dayErrors.openTime = 'Opening time required.';
    }
    if (isBlank(dayHours.closeTime)) {
      dayErrors.closeTime = 'Closing time required.';
    }

    if (Object.keys(dayErrors).length > 0) {
      errors[day] = dayErrors;
    }
  });

  return {
    errors,
    message: hasOpenDay ? '' : 'Please keep at least one business day open.',
  };
};

const validateDocuments = (form: DocumentForm) => {
  const errors: DocumentFormErrors = {};

  if (!form.tradeLicense) {
    errors.tradeLicense = 'Please upload trade license.';
  }
  if (!form.fssaiCertificate) {
    errors.fssaiCertificate = 'Please upload FSSAI certificate.';
  }
  if (!form.idProof) {
    errors.idProof = 'Please upload ID proof.';
  }

  return errors;
};

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

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
    getBusinessAndCuisineTypes,
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
  const [businessErrors, setBusinessErrors] = useState<BusinessFormErrors>({});
  const [cuisineOptions, setCuisineOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const loadBusinessAndCuisineTypes = async () => {
      try {
        const response = await getBusinessAndCuisineTypes();

        if (!isApiSuccess(response.success) || !response.data) {
          showToast(
            response.message || 'Unable to load business and cuisine types.',
            'error',
          );
          return;
        }

        setCuisineOptions(
          response.data.cuisineTypes.map(type => ({
            label: type.name,
            value: type.name,
          })),
        );
        setBusinessTypeOptions(
          response.data.businessTypes.map(type => ({
            label: type.name,
            value: type.name,
          })),
        );
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'Unable to load business and cuisine types.';
        showToast(message, 'error');
      }
    };

    loadBusinessAndCuisineTypes();
  }, [getBusinessAndCuisineTypes, showToast]);

  const [locationForm, setLocationForm] = useState<LocationForm>({
    address: '',
    area: '',
    city: '',
    pinCode: '',
    coordinates: null,
  });
  const [locationErrors, setLocationErrors] = useState<LocationFormErrors>({});

  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);
  const [hoursErrors, setHoursErrors] = useState<HoursFormErrors>({});
  const [hoursMessage, setHoursMessage] = useState('');
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
  const [documentErrors, setDocumentErrors] = useState<DocumentFormErrors>({});

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
      setBusinessErrors(prev => ({ ...prev, businessPhoto: undefined }));
    } else {
      setDocuments(prev => ({ ...prev, [pickerTarget]: selectedFile }));
      setDocumentErrors(prev => ({ ...prev, [pickerTarget]: undefined }));
    }
  };

  const updateBusinessField = (
    field: Exclude<keyof BusinessForm, 'businessPhoto'>,
    value: string,
  ) => {
    setBusinessForm(prev => ({ ...prev, [field]: value }));
    setBusinessErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateLocationField = (
    field: Exclude<keyof LocationForm, 'coordinates'>,
    value: string,
  ) => {
    setLocationForm(prev => ({ ...prev, [field]: value }));
    setLocationErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateLocationCoordinates = (coordinates: MapCoordinates) => {
    setLocationForm(prev => ({ ...prev, coordinates }));
    setLocationErrors(prev => ({ ...prev, coordinates: undefined }));
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
    const businessValidationErrors = validateBusinessDetails(businessForm);
    const locationValidationErrors = validateLocationDetails(locationForm);

    setBusinessErrors(businessValidationErrors);
    setLocationErrors(locationValidationErrors);

    if (
      hasErrors(businessValidationErrors) ||
      hasErrors(locationValidationErrors)
    ) {
      showToast('Please complete all business and location details.', 'error');
      return;
    }

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
    const validation = validateBusinessHours(hours);

    setHoursErrors(validation.errors);
    setHoursMessage(validation.message);

    if (hasErrors(validation.errors) || validation.message) {
      showToast(
        validation.message || 'Please complete your business hours.',
        'error',
      );
      return;
    }

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
    const validationErrors = validateDocuments(documents);

    setDocumentErrors(validationErrors);

    if (hasErrors(validationErrors)) {
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
      const validationErrors = validateBusinessDetails(businessForm);
      setBusinessErrors(validationErrors);

      if (hasErrors(validationErrors)) {
        showToast('Please complete business details.', 'error');
        return;
      }

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
    setHoursErrors(prev => ({ ...prev, [day]: undefined }));
    setHoursMessage('');
  };

  const setTime = (time: string) => {
    setHours(prev => ({
      ...prev,
      [timePicker.day]: {
        ...prev[timePicker.day],
        [timePicker.field]: time,
      },
    }));
    setHoursErrors(prev => ({
      ...prev,
      [timePicker.day]: {
        ...prev[timePicker.day],
        [timePicker.field]: undefined,
      },
    }));
    setHoursMessage('');
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
              errors={businessErrors}
              cuisineOptions={cuisineOptions}
              businessTypeOptions={businessTypeOptions}
              onFormChange={updateBusinessField}
              onPickPhoto={() => openPicker('businessPhoto')}
            />
          )}

          {currentStep === 2 && (
            <LocationDetailsStep
              form={locationForm}
              errors={locationErrors}
              onFormChange={updateLocationField}
              onCoordinatesChange={updateLocationCoordinates}
            />
          )}

          {currentStep === 3 && (
            <BusinessHoursStep
              hours={hours}
              errors={hoursErrors}
              screenError={hoursMessage}
              onToggleDay={toggleDay}
              onOpenTimePicker={(day, field) =>
                setTimePicker({ visible: true, day, field })
              }
            />
          )}

          {currentStep === 4 && (
            <DocumentsStep
              documents={documents}
              errors={documentErrors}
              onPickDocument={openPicker}
            />
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
  error,
}: {
  label: string;
  uri?: string | null;
  onPress: () => void;
  large?: boolean;
  error?: string;
}) {
  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.uploadBox,
          large && styles.photoUploadBox,
          error ? styles.uploadBoxError : null,
          error ? styles.uploadBoxErrorSpacing : null,
        ]}
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function BusinessDetailsStep({
  form,
  errors,
  cuisineOptions,
  businessTypeOptions,
  onFormChange,
  onPickPhoto,
}: {
  form: BusinessForm;
  errors: BusinessFormErrors;
  cuisineOptions: { label: string; value: string }[];
  businessTypeOptions: { label: string; value: string }[];
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
        error={errors.businessPhoto}
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
        error={errors.businessName}
      />
      <Select
        label="Cuisine Type"
        placeholder=""
        options={cuisineOptions}
        value={form.cuisineType}
        onChange={value => onFormChange('cuisineType', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
        error={errors.cuisineType}
      />
      <Select
        label="Business Type"
        placeholder=""
        options={businessTypeOptions}
        value={form.businessType}
        onChange={value => onFormChange('businessType', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
        error={errors.businessType}
      />
    </View>
  );
}

function LocationDetailsStep({
  form,
  errors,
  onFormChange,
  onCoordinatesChange,
}: {
  form: LocationForm;
  errors: LocationFormErrors;
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
        error={errors.address}
      />
      <InputText
        label="Area"
        placeholder="Enter Area"
        value={form.area}
        onChangeText={value => onFormChange('area', value)}
        containerStyle={styles.inputField}
        labelStyle={styles.compactLabel}
        inputStyle={styles.inputText}
        error={errors.area}
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
            error={errors.city}
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
            error={errors.pinCode}
          />
        </View>
      </View>

      <View
        style={[styles.mapBox, errors.coordinates ? styles.mapBoxError : null]}
      >
        <MapView
          selectedCoordinates={form.coordinates}
          onSelectCoordinates={onCoordinatesChange}
          showSelectedLabel
        />
      </View>
      {errors.coordinates && (
        <Text style={styles.errorText}>{errors.coordinates}</Text>
      )}
    </View>
  );
}

function BusinessHoursStep({
  hours,
  errors,
  screenError,
  onToggleDay,
  onOpenTimePicker,
}: {
  hours: Record<string, DayHours>;
  errors: HoursFormErrors;
  screenError: string;
  onToggleDay: (day: string) => void;
  onOpenTimePicker: (day: string, field: 'openTime' | 'closeTime') => void;
}) {
  return (
    <View style={styles.hoursList}>
      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
      {DAYS.map(day => {
        const config = hours[day];
        const dayErrors = errors[day];
        const dayError =
          dayErrors?.openTime && dayErrors?.closeTime
            ? 'Opening and closing time required.'
            : dayErrors?.openTime || dayErrors?.closeTime;

        return (
          <View key={day} style={styles.dayBlock}>
            <View style={styles.dayRow}>
              <Text style={styles.dayName}>{day}</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.timeBox,
                  dayErrors?.openTime ? styles.timeBoxError : null,
                ]}
                onPress={() => onOpenTimePicker(day, 'openTime')}
              >
                <Text style={styles.timeText}>{config.openTime}</Text>
              </TouchableOpacity>
              <Text style={styles.timeSeparator}>to</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.timeBox,
                  dayErrors?.closeTime ? styles.timeBoxError : null,
                ]}
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
            {dayError ? (
              <Text style={styles.dayErrorText}>{dayError}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function DocumentsStep({
  documents,
  errors,
  onPickDocument,
}: {
  documents: DocumentForm;
  errors: DocumentFormErrors;
  onPickDocument: (target: PickerTarget) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Trade License</Text>
      <UploadBox
        label="Upload"
        uri={documents.tradeLicense?.uri}
        onPress={() => onPickDocument('tradeLicense')}
        error={errors.tradeLicense}
      />

      <Text style={styles.fieldLabel}>FSSAI Certificate</Text>
      <UploadBox
        label="Upload"
        uri={documents.fssaiCertificate?.uri}
        onPress={() => onPickDocument('fssaiCertificate')}
        error={errors.fssaiCertificate}
      />

      <Text style={styles.fieldLabel}>ID Proof</Text>
      <UploadBox
        label="Upload"
        uri={documents.idProof?.uri}
        onPress={() => onPickDocument('idProof')}
        error={errors.idProof}
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
  errorText: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 14,
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
  uploadBoxError: {
    borderColor: colors.error,
  },
  uploadBoxErrorSpacing: {
    marginBottom: 0,
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
  mapBoxError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  hoursList: {
    paddingTop: 18,
  },
  dayBlock: {
    marginBottom: 4,
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
  timeBoxError: {
    borderColor: colors.error,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  dayErrorText: {
    color: colors.error,
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 0,
    marginTop: -2,
    marginBottom: 6,
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
