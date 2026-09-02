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
import Button from '../components/Button';
import CommonHeader from '../components/CommonHeader';
import ImagePickerModal from '../components/PickImage';
import InputText from '../components/InputText';
import KeyboardWrapper from '../components/KeyboardWrapper';
import Select from '../components/Select';
import CameraSvg from '../assets/svg/Code/CameraSvg';
import { navigate } from '../navigation/navigationRef';
import { colors } from '../styles/theme';
import { scale, vh } from '../utils/responsive';

type Step = 1 | 2 | 3 | 4;
type PickerTarget = 'businessPhoto' | 'tradeLicense' | 'fassiCertificate' | 'idProof' | null;

type BusinessForm = {
  businessPhotoUri: string | null;
  businessName: string;
  cuisineType: string;
  businessType: string;
};

type LocationForm = {
  address: string;
  area: string;
  city: string;
  pinCode: string;
};

type DayHours = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

type DocumentForm = {
  tradeLicense: string | null;
  fassiCertificate: string | null;
  idProof: string | null;
};

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

const BUSINESS_OPTIONS = [
  { label: 'Raun Restaurant', value: 'raun_restaurant' },
  { label: 'Cafe', value: 'cafe' },
  { label: 'Cloud Kitchen', value: 'cloud_kitchen' },
];

const CUISINE_OPTIONS = [
  { label: 'Indian', value: 'indian' },
  { label: 'Arabic', value: 'arabic' },
  { label: 'Italian', value: 'italian' },
  { label: 'Chinese', value: 'chinese' },
];

const BUSINESS_TYPE_OPTIONS = [
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Cafe', value: 'cafe' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Food Truck', value: 'food_truck' },
];

const CITY_OPTIONS = [
  { label: 'Dubai', value: 'dubai' },
  { label: 'Abu Dhabi', value: 'abu_dhabi' },
  { label: 'Sharjah', value: 'sharjah' },
  { label: 'Ajman', value: 'ajman' },
];

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_OPTIONS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
];

const DEFAULT_HOURS: Record<string, DayHours> = Object.fromEntries(
  DAYS.map(day => [day, { enabled: true, openTime: '09:00 AM', closeTime: '11:00 AM' }]),
) as Record<string, DayHours>;

export default function BusinessInfoOwner() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const [businessForm, setBusinessForm] = useState<BusinessForm>({
    businessPhotoUri: null,
    businessName: '',
    cuisineType: '',
    businessType: '',
  });

  const [locationForm, setLocationForm] = useState<LocationForm>({
    address: '',
    area: '',
    city: '',
    pinCode: '',
  });

  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);
  const [timePicker, setTimePicker] = useState<{
    visible: boolean;
    day: string;
    field: 'openTime' | 'closeTime';
  }>({ visible: false, day: '', field: 'openTime' });

  const [documents, setDocuments] = useState<DocumentForm>({
    tradeLicense: null,
    fassiCertificate: null,
    idProof: null,
  });

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    const uri = response.assets?.[0]?.uri;
    if (!uri || !pickerTarget) return;

    if (pickerTarget === 'businessPhoto') {
      setBusinessForm(prev => ({ ...prev, businessPhotoUri: uri }));
    } else {
      setDocuments(prev => ({ ...prev, [pickerTarget]: uri }));
    }
  };

  const handleContinue = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
      return;
    }

    navigate('ProfileUnderReview');
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
            <Text style={styles.subHeading}>{STEP_META[currentStep].subtitle}</Text>
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
            <DocumentsStep
              documents={documents}
              onPickDocument={openPicker}
            />
          )}

          <Button
            title={currentStep === 4 ? 'Submit For Review' : 'Continue'}
            onPress={handleContinue}
            fullWidth
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
        </View>
      </KeyboardWrapper>

      {timePicker.visible && (
        <View style={styles.timeSheet}>
          <Text style={styles.timeSheetTitle}>
            Select {timePicker.field === 'openTime' ? 'Opening' : 'Closing'} Time
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
            onPress={() => setTimePicker({ visible: false, day: '', field: 'openTime' })}
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
        <View style={[styles.stepperFill, { width: `${(currentStep / 4) * 100}%` }]} />
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
  onFormChange: (field: keyof BusinessForm, value: string) => void;
  onPickPhoto: () => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Business Photo</Text>
      <UploadBox
        label="Photos"
        uri={form.businessPhotoUri}
        onPress={onPickPhoto}
        large
      />

      <Select
        label="Business Name"
        placeholder=""
        options={BUSINESS_OPTIONS}
        value={form.businessName}
        onChange={value => onFormChange('businessName', value)}
        containerStyle={styles.fieldSpacing}
        labelStyle={styles.compactLabel}
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
}: {
  form: LocationForm;
  onFormChange: (field: keyof LocationForm, value: string) => void;
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
        <View style={[styles.mapShape, styles.mapShapeTopLeft]} />
        <View style={[styles.mapShape, styles.mapShapeTopRight]} />
        <View style={[styles.mapShape, styles.mapShapeBottomLeft]} />
        <View style={[styles.mapRoad, styles.mapRoadOne]} />
        <View style={[styles.mapRoad, styles.mapRoadTwo]} />
        <View style={[styles.mapRoad, styles.mapRoadThree]} />
        <View style={styles.mapPin}>
          <View style={styles.mapPinDot} />
        </View>
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
        uri={documents.tradeLicense}
        onPress={() => onPickDocument('tradeLicense')}
      />

      <Text style={styles.fieldLabel}>Fassi Certificate</Text>
      <UploadBox
        label="Upload"
        uri={documents.fassiCertificate}
        onPress={() => onPickDocument('fassiCertificate')}
      />

      <Text style={styles.fieldLabel}>ID Proof</Text>
      <UploadBox
        label="Upload"
        uri={documents.idProof}
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
  mapShape: {
    position: 'absolute',
    backgroundColor: '#BFE9D5',
    opacity: 0.9,
  },
  mapShapeTopLeft: {
    top: -24,
    left: -30,
    width: '72%',
    height: '60%',
    borderBottomRightRadius: 90,
  },
  mapShapeTopRight: {
    top: 12,
    right: -22,
    width: '52%',
    height: '48%',
    borderBottomLeftRadius: 70,
  },
  mapShapeBottomLeft: {
    left: 6,
    bottom: -28,
    width: '76%',
    height: '54%',
    borderTopRightRadius: 86,
  },
  mapRoad: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  mapRoadOne: {
    left: -20,
    right: 42,
    top: 58,
    transform: [{ rotate: '-12deg' }],
  },
  mapRoadTwo: {
    left: 44,
    right: -28,
    top: 112,
    transform: [{ rotate: '18deg' }],
  },
  mapRoadThree: {
    left: -16,
    right: 18,
    bottom: 42,
    transform: [{ rotate: '8deg' }],
  },
  mapPin: {
    position: 'absolute',
    left: '42%',
    top: '43%',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
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
