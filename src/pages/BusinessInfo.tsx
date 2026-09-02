import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../styles/theme';
import { scale } from '../utils/responsive';
import Button from '../components/Button';
import InputText from '../components/InputText';
import { navigate } from '../navigation/navigationRef';
import { ImagePickerResponse } from 'react-native-image-picker';
import CommonHeader from '../components/CommonHeader';
import Stepper from '../components/Stepper';
import CameraSvg from '../assets/svg/Code/CameraSvg';
import Select from '../components/Select';
import { languages } from '../assets/data/languages';
import KeyboardWrapper from '../components/KeyboardWrapper';
import ImagePickerModal from '../components/PickImage';

/* ─── Types ─────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3;

interface ProfileForm {
  fullName: string;
  professionalTitle: string;
  bio: string;
  language: string;
  profilePhotoUri: string | null;
}

interface WorkExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
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
  workingAreas: string;
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
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Weekends Only', value: 'weekends' },
  { label: 'Flexible', value: 'flexible' },
  { label: 'On Call', value: 'on_call' },
];

const WORKING_AREA_OPTIONS = [
  { label: 'Dubai', value: 'dubai' },
  { label: 'Abu Dhabi', value: 'abu_dhabi' },
  { label: 'Sharjah', value: 'sharjah' },
  { label: 'Ajman', value: 'ajman' },
  { label: 'Ras Al Khaimah', value: 'rak' },
  { label: 'Fujairah', value: 'fujairah' },
  { label: 'Umm Al Quwain', value: 'uaq' },
];

const STEP_META: Record<Step, { heading: string; subHeading: string }> = {
  1: {
    heading: "Let's get to know you.",
    subHeading: 'Tell clients about yourself and your professional background',
  },
  2: {
    heading: 'Your Work Experience',
    subHeading: 'Tell us about your professional experience and qualifications.',
  },
  3: {
    heading: 'Set Your Rates',
    subHeading: 'Set your service rates. You can update these later anytime.',
  },
};

const makeExperience = (): WorkExperienceEntry => ({
  id: Date.now().toString() + Math.random(),
  jobTitle: '',
  company: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
});

const makeEducation = (): EducationEntry => ({
  id: Date.now().toString() + Math.random(),
  degree: '',
  institution: '',
  year: '',
});

/* ─── Main Screen ────────────────────────────────────────────────── */
export default function BusinessInfoSP() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePickerTarget, setActivePickerTarget] = useState<ActivePickerTarget>(null);

  /* Step 1 */
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: '',
    professionalTitle: '',
    bio: '',
    language: '',
    profilePhotoUri: null,
  });

  /* Step 2 */
  const [workForm, setWorkForm] = useState<WorkExperienceForm>({
    totalExperience: '',
    experiences: [makeExperience()],
    educations: [],
  });

  /* Step 3 */
  const [ratesForm, setRatesForm] = useState<RatesForm>({
    hourlyRate: '',
    serviceCallCharge: '',
    minimumCharge: '',
    availabilityPreference: '',
    workingAreas: '',
  });

  /* ── Image picker ── */
  const openPicker = (target: ActivePickerTarget) => {
    setActivePickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    const uri = response.assets?.[0]?.uri;
    if (!uri) return;
    if (activePickerTarget === 'profilePhoto') {
      setProfile(prev => ({ ...prev, profilePhotoUri: uri }));
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
  const updateEducation = (id: string, field: keyof EducationEntry, value: string) =>
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

  /* ── Navigation ── */
  const handleContinue = () => {
    if (currentStep < 3) setCurrentStep((currentStep + 1) as Step);
    else navigate('ProfileUnderReview');
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const showBack = currentStep > 1;

  return (
    <View style={styles.container}>
      <CommonHeader
        useSafeAreaTop
        children={
          <View style={{ paddingBottom: 25 }}>
            <Text style={styles.heading}>{STEP_META[currentStep].heading}</Text>
            <Text style={styles.subHeading}>{STEP_META[currentStep].subHeading}</Text>
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
            />
          )}

          {/* Footer */}
          <View style={styles.footerRow}>
            {showBack && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={{
                  width: showBack ? "50%" : "100%"
                }}
              // style={styles.backBtn}
              />
            )}
            <Button
              title="Continue"
              onPress={handleContinue}
              style={{
                width: showBack ? "50%" : "100%"
              }}
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
  onFormChange: (field: keyof ProfileForm, value: string) => void;
  onPickProfilePhoto: () => void;
}

function ProfileInfoStep({ form, onFormChange, onPickProfilePhoto }: ProfileInfoStepProps) {
  return (
    <View style={styles.stepWrapper}>
      <View style={styles.profilePhotoContainer}>
        <Text style={styles.fieldLabel}>Profile Photo</Text>
        <TouchableOpacity
          onPress={onPickProfilePhoto}
          style={[
            styles.profilePhotoPicker,
            form.profilePhotoUri ? styles.profilePhotoPickerFilled : null,
          ]}
        >
          {form.profilePhotoUri ? (
            <Image source={{ uri: form.profilePhotoUri }} style={styles.profilePhotoImage} />
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
        inputStyle={{ height: scale(90), textAlignVertical: 'top' }}
      />
      <Select
        label="Language Spoken"
        options={languages}
        placeholder="Select Language"
        value={form.language}
        onChange={val => onFormChange('language', val)}
        searchable
      />
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
  onUpdateEducation: (id: string, field: keyof EducationEntry, value: string) => void;
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
        <Text style={styles.addBtnOutlineText}>+ Add Education or Certification</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Step 3: Set Your Rates ─────────────────────────────────────── */
interface SetRatesStepProps {
  form: RatesForm;
  onFormChange: (field: keyof RatesForm, value: string) => void;
}

function SetRatesStep({ form, onFormChange }: SetRatesStepProps) {
  return (
    <View style={styles.stepWrapper}>

      {/* Hourly Rate */}


      <View style={styles.rateInputWrapper}>
        <InputText
          label={"Hourly Rate"}
          placeholder="100.00"
          value={form.hourlyRate}
          onChangeText={val => onFormChange('hourlyRate', val)}
          keyboardType="decimal-pad"
          leftIcon={<View >
            <Text style={styles.currencyText}>AED</Text>
          </View>}
          rightIcon={
            <Text style={styles.rightText}>Per Hour</Text>
          }
        />
      </View>

      {/* Service Call Charge */}

          <InputText
            placeholder="150.00"
            label='Service Call Charge'
            value={form.serviceCallCharge}
            onChangeText={val => onFormChange('serviceCallCharge', val)}
            keyboardType="decimal-pad"
            leftIcon={<View >
              <Text style={styles.currencyText}>AED</Text>
            </View>}
            rightIcon={
              <Text style={styles.rightText}>Per Visit</Text>
            }
          />


      {/* Minimum Charge */}
     <InputText
            placeholder="100.00"
            label='Minimum Charge'
            value={form.minimumCharge}
            onChangeText={val => onFormChange('minimumCharge', val)}
            keyboardType="decimal-pad"
             leftIcon={<View >
              <Text style={styles.currencyText}>AED</Text>
            </View>}
            rightIcon={
              <Text style={styles.rightText}>Per Job</Text>
            }
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

      {/* Working Areas */}
      <Select
        label="Working Areas"
        options={WORKING_AREA_OPTIONS}
        placeholder="Choose Multiple Areas"
        value={form.workingAreas}
        onChange={val => onFormChange('workingAreas', val)}
        searchable
        containerStyle={styles.selectSpacing}
      />

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

function ExperienceCard({ entry, showRemove, onRemove, onChange }: ExperienceCardProps) {
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
        value={entry.company}
        onChangeText={val => onChange('company', val)}
        containerStyle={styles.cardInput}
      />
      <View style={styles.dateRow}>
        <View style={styles.dateInputWrapper}>
          <InputText
            label="Start Date"
            placeholder="Select Date"
            value={entry.startDate}
            onChangeText={val => onChange('startDate', val)}
          />
        </View>
        <View style={styles.dateInputWrapper}>
          <InputText
            label="End Date"
            placeholder="Select Date"
            value={entry.endDate}
            onChangeText={val => onChange('endDate', val)}
            editable={!entry.currentlyWorking}
            inputStyle={entry.currentlyWorking ? styles.disabledInput : undefined}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange('currentlyWorking', !entry.currentlyWorking)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, entry.currentlyWorking && styles.checkboxChecked]}>
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
        value={entry.degree}
        onChangeText={val => onChange('degree', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Institution"
        placeholder="e.g. Delhi University"
        value={entry.institution}
        onChangeText={val => onChange('institution', val)}
        containerStyle={styles.cardInput}
      />
      <InputText
        label="Year of Completion"
        placeholder="e.g. 2020"
        value={entry.year}
        onChangeText={val => onChange('year', val)}
        keyboardType="number-pad"
      />
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

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    flex: 1,
  },
  continueBtnFull: {
    backgroundColor: colors.primary,
    width: '100%',
  },
  continueBtnFlex: {
    flex: 1,
    backgroundColor: colors.primary,
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
  disabledInput: { color: colors.textMuted },

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
