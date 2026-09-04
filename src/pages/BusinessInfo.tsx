import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../styles/theme';
import { scale } from '../utils/responsive';
import Button from '../components/Button';
import InputText from '../components/InputText';
import DatePicker from '../components/DatePicker';
import { navigate } from '../navigation/navigationRef';
import { ImagePickerResponse } from 'react-native-image-picker';
import CommonHeader from '../components/CommonHeader';
import Stepper from '../components/Stepper';
import CameraSvg from '../assets/svg/Code/CameraSvg';
import Select from '../components/Select';
import { languages } from '../assets/data/languages';
import KeyboardWrapper from '../components/KeyboardWrapper';
import ImagePickerModal from '../components/PickImage';
import type { RootStackParamList } from '../navigation';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import {
  isApiSuccess,
  useBusinessOwnerService,
  type BusinessOwner,
  type ServiceProviderOnboardingPayload,
  type UploadFile,
} from '../services/businessOwnerService';

/* ─── Types ─────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3;
type Props = NativeStackScreenProps<RootStackParamList, 'BusinessInfoSP'>;

interface ProfileForm {
  fullName: string;
  professionalTitle: string;
  bio: string;
  language: string;
  languages: string[];
  profilePhoto: UploadFile | null;
}

interface WorkExperienceEntry {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
}

interface EducationEntry {
  id: string;
  title: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
  certificateUrl: string;
}

interface WorkExperienceForm {
  totalExperience: string;
  experiences: WorkExperienceEntry[];
  educations: EducationEntry[];
}

interface RatesForm {
  hourlyRate: string;
  serviceCallCharge: string;
  minimumCharge: string;
  availabilityPreference: string;
  workingAreas: WorkingAreaEntry[];
}

interface WorkingAreaEntry {
  id: string;
  address: string;
  area: string;
  city: string;
  pinCode: string;
}

type ActivePickerTarget = 'profilePhoto' | null;

/* ─── Constants ─────────────────────────────────────────────────── */
const EXPERIENCE_RANGE_OPTIONS = [
  { label: 'Less than 1 year', value: 'lt1' },
  { label: '1 - 2 years', value: '1-2' },
  { label: '2 - 5 years', value: '2-5' },
  { label: '5 - 10 years', value: '5-10' },
  { label: '10+ years', value: '10+' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Weekends Only', value: 'WEEKENDS_ONLY' },
  { label: 'Flexible', value: 'FLEXIBLE' },
  { label: 'On Call', value: 'ON_CALL' },
];

const STEP_META: Record<Step, { heading: string; subHeading: string }> = {
  1: {
    heading: "Let's get to know you.",
    subHeading: 'Tell clients about yourself and your professional background',
  },
  2: {
    heading: 'Your Work Experience',
    subHeading:
      'Tell us about your professional experience and qualifications.',
  },
  3: {
    heading: 'Set Your Rates',
    subHeading: 'Set your service rates. You can update these later anytime.',
  },
};

const makeExperience = (): WorkExperienceEntry => ({
  id: Date.now().toString() + Math.random(),
  jobTitle: '',
  companyName: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
});

const makeEducation = (): EducationEntry => ({
  id: Date.now().toString() + Math.random(),
  title: '',
  institution: '',
  startDate: '',
  endDate: '',
  description: '',
  certificateUrl: '',
});

const makeWorkingArea = (): WorkingAreaEntry => ({
  id: Date.now().toString() + Math.random(),
  address: '',
  area: '',
  city: '',
  pinCode: '',
});

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

/* ─── Main Screen ────────────────────────────────────────────────── */
export default function BusinessInfoSP({ route }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(
    route.params?.initialStep || 1,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePickerTarget, setActivePickerTarget] =
    useState<ActivePickerTarget>(null);
  const login = useAuth(state => state.login);
  const showToast = useToast(state => state.showToast);
  const {
    authenticateOwner,
    updateServiceProviderOnboarding,
    loading,
    clearError,
  } = useBusinessOwnerService();

  /* Step 1 */
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: '',
    professionalTitle: '',
    bio: '',
    language: '',
    languages: [],
    profilePhoto: null,
  });

  /* Step 2 */
  const [workForm, setWorkForm] = useState<WorkExperienceForm>({
    totalExperience: '',
    experiences: [makeExperience()],
    educations: [makeEducation()],
  });

  /* Step 3 */
  const [ratesForm, setRatesForm] = useState<RatesForm>({
    hourlyRate: '',
    serviceCallCharge: '',
    minimumCharge: '',
    availabilityPreference: '',
    workingAreas: [makeWorkingArea()],
  });

  /* ── Image picker ── */
  const openPicker = (target: ActivePickerTarget) => {
    setActivePickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    const asset = response.assets?.[0];
    const uri = asset?.uri;
    if (!uri) return;
    if (activePickerTarget === 'profilePhoto') {
      setProfile(prev => ({
        ...prev,
        profilePhoto: {
          uri,
          name: asset.fileName,
          type: asset.type,
        },
      }));
    }
  };

  /* ── Work experience ── */
  const updateExperience = (
    id: string,
    field: keyof WorkExperienceEntry,
    value: string | boolean,
  ) => {
    setWorkForm(prev => ({
      ...prev,
      experiences: prev.experiences.map(e =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const addExperience = () =>
    setWorkForm(prev => ({
      ...prev,
      experiences: [...prev.experiences, makeExperience()],
    }));

  const removeExperience = (id: string) =>
    setWorkForm(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== id),
    }));

  /* ── Education ── */
  const updateEducation = (
    id: string,
    field: keyof EducationEntry,
    value: string,
  ) =>
    setWorkForm(prev => ({
      ...prev,
      educations: prev.educations.map(e =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));

  const addEducation = () =>
    setWorkForm(prev => ({
      ...prev,
      educations: [...prev.educations, makeEducation()],
    }));

  const removeEducation = (id: string) =>
    setWorkForm(prev => ({
      ...prev,
      educations: prev.educations.filter(e => e.id !== id),
    }));

  const updateWorkingArea = (
    id: string,
    field: keyof WorkingAreaEntry,
    value: string,
  ) =>
    setRatesForm(prev => ({
      ...prev,
      workingAreas: prev.workingAreas.map(area =>
        area.id === id ? { ...area, [field]: value } : area,
      ),
    }));

  const addWorkingArea = () =>
    setRatesForm(prev => ({
      ...prev,
      workingAreas: [...prev.workingAreas, makeWorkingArea()],
    }));

  const removeWorkingArea = (id: string) =>
    setRatesForm(prev => ({
      ...prev,
      workingAreas: prev.workingAreas.filter(area => area.id !== id),
    }));

  const addLanguage = (value: string) => {
    const languageLabel =
      languages.find(language => language.value === value)?.label || value;

    setProfile(prev => ({
      ...prev,
      language: value,
      languages: prev.languages.includes(languageLabel)
        ? prev.languages
        : [...prev.languages, languageLabel],
    }));
  };

  const removeLanguage = (value: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(language => language !== value),
    }));
  };

  const handleProfileSubmit = async () => {
    const authDraft = route.params?.authDraft;

    if (!authDraft?.email || !authDraft.password) {
      showToast('Please login again before completing onboarding.', 'error');
      navigate('login');
      return;
    }

    if (
      !profile.profilePhoto ||
      !profile.fullName ||
      !profile.professionalTitle ||
      !profile.bio ||
      profile.languages.length === 0
    ) {
      showToast('Please complete your profile details.', 'error');
      return;
    }

    try {
      clearError();
      const response = await authenticateOwner({
        email: authDraft.email,
        password: authDraft.password,
        type: authDraft.type,
        profilePhoto: profile.profilePhoto,
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        about: profile.bio,
        languages: profile.languages,
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
        setCurrentStep(2);
        return;
      }

      showToast(response.message || 'Unable to save profile details.', 'error');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to save profile details.';
      showToast(message, 'error');
    }
  };

  const buildServiceProviderPayload = (): ServiceProviderOnboardingPayload => ({
    workExperiences: workForm.experiences.map(experience => ({
      jobTitle: experience.jobTitle,
      companyName: experience.companyName,
      startDate: experience.startDate,
      endDate: experience.currentlyWorking ? null : experience.endDate || null,
      currentlyWorking: experience.currentlyWorking,
    })),
    educationCertifications: workForm.educations.map(education => ({
      title: education.title,
      institution: education.institution,
      startDate: education.startDate,
      endDate: education.endDate,
      description: education.description,
      certificateUrl: education.certificateUrl,
    })),
    hourlyRate: Number(ratesForm.hourlyRate),
    serviceCallCharge: Number(ratesForm.serviceCallCharge),
    minimumCharge: Number(ratesForm.minimumCharge),
    currency: 'AED',
    availabilityPreference: ratesForm.availabilityPreference,
    workingAreas: ratesForm.workingAreas.map(area => ({
      address: area.address,
      area: area.area,
      city: area.city,
      pinCode: area.pinCode,
    })),
  });

  const handleServiceProviderSubmit = async () => {
    const hasExperience = workForm.experiences.every(
      experience =>
        experience.jobTitle &&
        experience.companyName &&
        experience.startDate &&
        (experience.currentlyWorking || experience.endDate),
    );
    const hasEducation = workForm.educations.every(
      education =>
        education.title &&
        education.institution &&
        education.startDate &&
        education.endDate &&
        education.description &&
        education.certificateUrl,
    );
    const hasWorkingAreas = ratesForm.workingAreas.every(
      area => area.address && area.area && area.city && area.pinCode,
    );
    const hasRates =
      ratesForm.hourlyRate.trim() !== '' &&
      ratesForm.serviceCallCharge.trim() !== '' &&
      ratesForm.minimumCharge.trim() !== '' &&
      Number(ratesForm.hourlyRate) > 0 &&
      Number(ratesForm.serviceCallCharge) >= 0 &&
      Number(ratesForm.minimumCharge) >= 0 &&
      ratesForm.availabilityPreference;

    if (!hasExperience || !hasEducation || !hasWorkingAreas || !hasRates) {
      showToast(
        'Please complete experience, education, rates and areas.',
        'error',
      );
      return;
    }

    try {
      clearError();
      const response = await updateServiceProviderOnboarding(
        buildServiceProviderPayload(),
      );

      if (!isApiSuccess(response.success)) {
        showToast(response.message || 'Unable to submit profile.', 'error');
        return;
      }

      navigate('ProfileUnderReview');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unable to submit profile.';
      showToast(message, 'error');
    }
  };

  /* ── Navigation ── */
  const handleContinue = () => {
    if (currentStep === 1) {
      handleProfileSubmit();
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }

    handleServiceProviderSubmit();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const showBack = currentStep > 1;
  const continueTitle =
    currentStep === 1
      ? 'Save Profile'
      : currentStep === 2
      ? 'Continue To Rates'
      : 'Submit For Review';

  return (
    <View style={styles.container}>
      <CommonHeader
        useSafeAreaTop
        children={
          <View style={styles.headerContent}>
            <Text style={styles.heading}>{STEP_META[currentStep].heading}</Text>
            <Text style={styles.subHeading}>
              {STEP_META[currentStep].subHeading}
            </Text>
            <Stepper length={3} currentStep={currentStep - 1} />
          </View>
        }
      />

      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onChange={handlePickerResult}
      />

      <KeyboardWrapper scroll keyboardVerticalOffset={60}>
        <View style={styles.scrollContent}>
          {currentStep === 1 && (
            <ProfileInfoStep
              form={profile}
              onFormChange={(field, value) =>
                setProfile(prev => ({ ...prev, [field]: value }))
              }
              onLanguageSelect={addLanguage}
              onRemoveLanguage={removeLanguage}
              onPickProfilePhoto={() => openPicker('profilePhoto')}
            />
          )}

          {currentStep === 2 && (
            <WorkExperienceStep
              form={workForm}
              onTotalExperienceChange={val =>
                setWorkForm(prev => ({ ...prev, totalExperience: val }))
              }
              onUpdateExperience={updateExperience}
              onAddExperience={addExperience}
              onRemoveExperience={removeExperience}
              onUpdateEducation={updateEducation}
              onAddEducation={addEducation}
              onRemoveEducation={removeEducation}
            />
          )}

          {currentStep === 3 && (
            <SetRatesStep
              form={ratesForm}
              onFormChange={(field, value) =>
                setRatesForm(prev => ({ ...prev, [field]: value }))
              }
              onUpdateWorkingArea={updateWorkingArea}
              onAddWorkingArea={addWorkingArea}
              onRemoveWorkingArea={removeWorkingArea}
            />
          )}

          {/* Footer */}
          <View style={styles.footerRow}>
            {showBack && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.footerButton}
              />
            )}
            <Button
              title={continueTitle}
              onPress={handleContinue}
              loading={loading}
              style={styles.footerButton}
            />
          </View>
        </View>
      </KeyboardWrapper>
    </View>
  );
}

/* ─── Step 1: Profile Info ───────────────────────────────────────── */
interface ProfileInfoStepProps {
  form: ProfileForm;
  onFormChange: (
    field: Exclude<keyof ProfileForm, 'profilePhoto' | 'languages'>,
    value: string,
  ) => void;
  onLanguageSelect: (value: string) => void;
  onRemoveLanguage: (value: string) => void;
  onPickProfilePhoto: () => void;
}

function ProfileInfoStep({
  form,
  onFormChange,
  onLanguageSelect,
  onRemoveLanguage,
  onPickProfilePhoto,
}: ProfileInfoStepProps) {
  return (
    <View style={styles.stepWrapper}>
      <View style={styles.profilePhotoContainer}>
        <Text style={styles.fieldLabel}>Profile Photo</Text>
        <TouchableOpacity
          onPress={onPickProfilePhoto}
          style={[
            styles.profilePhotoPicker,
            form.profilePhoto ? styles.profilePhotoPickerFilled : null,
          ]}
        >
          {form.profilePhoto ? (
            <Image
              source={{ uri: form.profilePhoto.uri }}
              style={styles.profilePhotoImage}
            />
          ) : (
            <CameraSvg />
          )}
        </TouchableOpacity>
      </View>

      <InputText
        label="Full Name"
        placeholder="Enter Full Name"
        value={form.fullName}
        onChangeText={val => onFormChange('fullName', val)}
        containerStyle={styles.inputSpacing}
      />
      <InputText
        label="Professional Title"
        placeholder="e.g. Plumber, Electrician"
        value={form.professionalTitle}
        onChangeText={val => onFormChange('professionalTitle', val)}
        containerStyle={styles.inputSpacing}
      />
      <InputText
        label="About / Bio"
        placeholder="Write a short bio"
        value={form.bio}
        onChangeText={val => onFormChange('bio', val)}
        multiline
        numberOfLines={4}
        inputStyle={styles.bioInput}
      />
      <Select
        label="Language Spoken"
        options={languages}
        placeholder="Select Language"
        value={form.language}
        onChange={onLanguageSelect}
        searchable
      />
      {form.languages.length > 0 && (
        <View style={styles.chipRow}>
          {form.languages.map(language => (
            <TouchableOpacity
              key={language}
              activeOpacity={0.75}
              style={styles.chip}
              onPress={() => onRemoveLanguage(language)}
            >
              <Text style={styles.chipText}>{language} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Step 2: Work Experience ────────────────────────────────────── */
interface WorkExperienceStepProps {
  form: WorkExperienceForm;
  onTotalExperienceChange: (val: string) => void;
  onUpdateExperience: (
    id: string,
    field: keyof WorkExperienceEntry,
    value: string | boolean,
  ) => void;
  onAddExperience: () => void;
  onRemoveExperience: (id: string) => void;
  onUpdateEducation: (
    id: string,
    field: keyof EducationEntry,
    value: string,
  ) => void;
  onAddEducation: () => void;
  onRemoveEducation: (id: string) => void;
}

function WorkExperienceStep({
  form,
  onTotalExperienceChange,
  onUpdateExperience,
  onAddExperience,
  onRemoveExperience,
  onUpdateEducation,
  onAddEducation,
  onRemoveEducation,
}: WorkExperienceStepProps) {
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.sectionLabel}>Total Experience</Text>
      <Select
        options={EXPERIENCE_RANGE_OPTIONS}
        placeholder="Select experience Range"
        value={form.totalExperience}
        onChange={onTotalExperienceChange}
        containerStyle={styles.selectSpacing}
      />

      <Text style={styles.sectionLabel}>Work Experience</Text>
      {form.experiences.map(exp => (
        <ExperienceCard
          key={exp.id}
          entry={exp}
          showRemove={form.experiences.length > 1}
          onRemove={() => onRemoveExperience(exp.id)}
          onChange={(field, value) => onUpdateExperience(exp.id, field, value)}
        />
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={onAddExperience}>
        <Text style={styles.addBtnText}>+ Add Another Experience</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
        Education / Certification
      </Text>
      {form.educations.map(edu => (
        <EducationCard
          key={edu.id}
          entry={edu}
          onRemove={() => onRemoveEducation(edu.id)}
          onChange={(field, value) => onUpdateEducation(edu.id, field, value)}
        />
      ))}

      <TouchableOpacity style={styles.addBtnOutline} onPress={onAddEducation}>
        <Text style={styles.addBtnOutlineText}>
          + Add Education or Certification
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Step 3: Set Your Rates ─────────────────────────────────────── */
interface SetRatesStepProps {
  form: RatesForm;
  onFormChange: (
    field: Exclude<keyof RatesForm, 'workingAreas'>,
    value: string,
  ) => void;
  onUpdateWorkingArea: (
    id: string,
    field: keyof WorkingAreaEntry,
    value: string,
  ) => void;
  onAddWorkingArea: () => void;
  onRemoveWorkingArea: (id: string) => void;
}

function SetRatesStep({
  form,
  onFormChange,
  onUpdateWorkingArea,
  onAddWorkingArea,
  onRemoveWorkingArea,
}: SetRatesStepProps) {
  return (
    <View style={styles.stepWrapper}>
      {/* Hourly Rate */}

      <View style={styles.rateInputWrapper}>
        <InputText
          label={'Hourly Rate'}
          placeholder="100.00"
          value={form.hourlyRate}
          onChangeText={val => onFormChange('hourlyRate', val)}
          keyboardType="decimal-pad"
          leftIcon={
            <View>
              <Text style={styles.currencyText}>AED</Text>
            </View>
          }
          rightIcon={<Text style={styles.rightText}>Per Hour</Text>}
        />
      </View>

      {/* Service Call Charge */}

      <InputText
        placeholder="150.00"
        label="Service Call Charge"
        value={form.serviceCallCharge}
        onChangeText={val => onFormChange('serviceCallCharge', val)}
        keyboardType="decimal-pad"
        leftIcon={
          <View>
            <Text style={styles.currencyText}>AED</Text>
          </View>
        }
        rightIcon={<Text style={styles.rightText}>Per Visit</Text>}
      />

      {/* Minimum Charge */}
      <InputText
        placeholder="100.00"
        label="Minimum Charge"
        value={form.minimumCharge}
        onChangeText={val => onFormChange('minimumCharge', val)}
        keyboardType="decimal-pad"
        leftIcon={
          <View>
            <Text style={styles.currencyText}>AED</Text>
          </View>
        }
        rightIcon={<Text style={styles.rightText}>Per Job</Text>}
      />

      {/* Availability Preference */}
      <Select
        label="Availability Preference"
        options={AVAILABILITY_OPTIONS}
        placeholder="Select your Availability"
        value={form.availabilityPreference}
        onChange={val => onFormChange('availabilityPreference', val)}
        containerStyle={styles.selectSpacing}
      />

      <Text style={styles.sectionLabel}>Working Areas</Text>
      {form.workingAreas.map(area => (
        <WorkingAreaCard
          key={area.id}
          entry={area}
          showRemove={form.workingAreas.length > 1}
          onRemove={() => onRemoveWorkingArea(area.id)}
          onChange={(field, value) =>
            onUpdateWorkingArea(area.id, field, value)
          }
        />
      ))}
      <TouchableOpacity style={styles.addBtnOutline} onPress={onAddWorkingArea}>
        <Text style={styles.addBtnOutlineText}>+ Add Working Area</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Experience Card ────────────────────────────────────────────── */
interface ExperienceCardProps {
  entry: WorkExperienceEntry;
  showRemove: boolean;
  onRemove: () => void;
  onChange: (field: keyof WorkExperienceEntry, value: string | boolean) => void;
}

function ExperienceCard({
  entry,
  showRemove,
  onRemove,
  onChange,
}: ExperienceCardProps) {
  return (
    <View style={styles.card}>
      {showRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      )}
      <InputText
        label="Job Title / Role"
        placeholder="Senior Electricians"
        value={entry.jobTitle}
        onChangeText={val => onChange('jobTitle', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Company / Organizations"
        placeholder="ABC Electrical Services"
        value={entry.companyName}
        onChangeText={val => onChange('companyName', val)}
        containerStyle={styles.cardInput}
      />
      <View style={styles.dateRow}>
        <View style={styles.dateInputWrapper}>
          <DatePicker
            label="Start Date"
            placeholder="Select Date"
            value={entry.startDate}
            onChange={val => onChange('startDate', val)}
          />
        </View>
        <View style={styles.dateInputWrapper}>
          <DatePicker
            label="End Date"
            placeholder="Select Date"
            value={entry.endDate}
            onChange={val => onChange('endDate', val)}
            disabled={entry.currentlyWorking}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange('currentlyWorking', !entry.currentlyWorking)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            entry.currentlyWorking && styles.checkboxChecked,
          ]}
        >
          {entry.currentlyWorking && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I currently work here</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Education Card ─────────────────────────────────────────────── */
interface EducationCardProps {
  entry: EducationEntry;
  onRemove: () => void;
  onChange: (field: keyof EducationEntry, value: string) => void;
}

function EducationCard({ entry, onRemove, onChange }: EducationCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
      <InputText
        label="Degree / Certificate"
        placeholder="e.g. B.Tech Electrical Engineering"
        value={entry.title}
        onChangeText={val => onChange('title', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Institution"
        placeholder="e.g. Delhi University"
        value={entry.institution}
        onChangeText={val => onChange('institution', val)}
        containerStyle={styles.cardInput}
      />
      <DatePicker
        label="Start Date"
        placeholder="Select Date"
        value={entry.startDate}
        onChange={val => onChange('startDate', val)}
        containerStyle={styles.cardInput}
      />
      <DatePicker
        label="End Date"
        placeholder="Select Date"
        value={entry.endDate}
        onChange={val => onChange('endDate', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Description"
        placeholder="Describe your certification"
        value={entry.description}
        onChangeText={val => onChange('description', val)}
        multiline
        inputStyle={styles.multilineInput}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Certificate URL"
        placeholder="https://example.com/certificate.pdf"
        value={entry.certificateUrl}
        onChangeText={val => onChange('certificateUrl', val)}
        autoCapitalize="none"
      />
    </View>
  );
}

interface WorkingAreaCardProps {
  entry: WorkingAreaEntry;
  showRemove: boolean;
  onRemove: () => void;
  onChange: (field: keyof WorkingAreaEntry, value: string) => void;
}

function WorkingAreaCard({
  entry,
  showRemove,
  onRemove,
  onChange,
}: WorkingAreaCardProps) {
  return (
    <View style={styles.card}>
      {showRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      )}
      <InputText
        label="Address"
        placeholder="Downtown Dubai"
        value={entry.address}
        onChangeText={val => onChange('address', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Area"
        placeholder="Downtown"
        value={entry.area}
        onChangeText={val => onChange('area', val)}
        containerStyle={styles.cardInput}
      />
      <View style={styles.dateRow}>
        <View style={styles.dateInputWrapper}>
          <InputText
            label="City"
            placeholder="Dubai"
            value={entry.city}
            onChangeText={val => onChange('city', val)}
          />
        </View>
        <View style={styles.dateInputWrapper}>
          <InputText
            label="Pin Code"
            placeholder="00000"
            value={entry.pinCode}
            onChangeText={val => onChange('pinCode', val)}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screen },

  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.3,
  },
  subHeading: {
    fontSize: 13,
    color: colors.secondaryLight,
    marginTop: 4,
    marginBottom: 18,
  },

  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: 40,
  },
  headerContent: {
    paddingBottom: 25,
  },

  /* Footer */
  footerRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    height: 48,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  footerButtonFull: {
    height: 48,
    width: '100%',
  },

  /* Step shared */
  stepWrapper: { paddingTop: 24 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  sectionLabelTop: { marginTop: 20 },
  inputSpacing: { marginBottom: 16 },
  selectSpacing: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },

  /* Profile photo */
  profilePhotoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhotoPicker: {
    borderColor: colors.primary,
    borderStyle: 'dotted',
    borderWidth: 2,
    height: scale(96),
    width: scale(96),
    borderRadius: scale(50),
    marginTop: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profilePhotoPickerFilled: {
    borderStyle: 'solid',
    borderColor: colors.secondary,
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
  },

  /* Rate rows */
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: colors.screen,
    overflow: 'hidden',
  },
  currencyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surfaceMuted,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rateInputWrapper: {
    flex: 1,
  },
  rateUnit: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateUnitText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  rightText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  bioInput: {
    height: scale(90),
    textAlignVertical: 'top',
  },
  multilineInput: {
    minHeight: scale(86),
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  /* Cards */
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: scale(14),
    marginBottom: 14,
    backgroundColor: colors.screen,
    position: 'relative',
  },
  cardInput: { marginBottom: 10 },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeBtnText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '700',
  },

  /* Date row */
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrapper: { flex: 1 },

  /* Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.screen,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxTick: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.text,
  },

  /* Add buttons */
  addBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: scale(14),
    alignItems: 'center',
    marginBottom: 4,
  },
  addBtnText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  addBtnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: scale(14),
    alignItems: 'center',
    marginBottom: 4,
  },
  addBtnOutlineText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
