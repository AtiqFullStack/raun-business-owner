jest.mock('lucide-react-native', () =>
  Object.fromEntries(
    ['ArrowUpRight', 'Check', 'ChevronRight', 'MapPin', 'Search', 'X'].map(
      name => [name, () => null],
    ),
  ),
);
jest.mock('../src/navigation/navigationRef', () => ({ navigate: jest.fn() }));
jest.mock('../src/store/useAuth', () => ({
  useAuth: (select: any) => select({ login: mockLogin }),
}));
jest.mock('../src/store/useToast', () => ({
  useToast: (select: any) => select({ showToast: mockToast }),
}));
jest.mock('../src/services/businessOwnerService', () => ({
  isApiSuccess: (value: unknown) => value === true,
  useBusinessOwnerService: () => ({
    authenticateOwner: mockAuthenticate,
    updateServiceProviderOnboarding: mockOnboard,
    loading: false,
    clearError: jest.fn(),
  }),
}));
jest.mock('../src/components/CommonHeader', () => () => null);
jest.mock('../src/components/Stepper', () => () => null);
jest.mock('../src/components/DatePicker', () => () => null);
jest.mock('../src/components/InputText', () => () => null);
jest.mock('../src/components/Select', () => () => null);
jest.mock('../src/components/PickImage', () => () => null);
jest.mock('../src/components/Button', () => () => null);
jest.mock('../src/components/DemandServiceTypeSelect', () => () => null);
jest.mock('../src/assets/svg/Code/CameraSvg', () => () => null);
jest.mock(
  '../src/components/KeyboardWrapper',
  () =>
    ({ children }: any) =>
      children,
);
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import BusinessInfoSP from '../src/pages/BusinessInfo';
import DemandServiceTypeSelect from '../src/components/DemandServiceTypeSelect';
import Button from '../src/components/Button';
import ImagePickerModal from '../src/components/PickImage';
const mockAuthenticate = jest.fn(),
  mockOnboard = jest.fn(),
  mockLogin = jest.fn(),
  mockToast = jest.fn();
let tree: ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticate.mockResolvedValue({
    success: true,
    data: {
      token: 'token',
      owner: {
        _id: 'owner',
        email: 'provider@test.local',
        role: 'BUSINESS_OWNER',
        type: 'SERVICE_PROVIDER',
      },
    },
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
async function mount(initialStep = 1) {
  await act(async () => {
    tree = create(
      <BusinessInfoSP
        navigation={{} as never}
        route={
          {
            params: {
              initialStep,
              authDraft: {
                email: 'provider@test.local',
                password: 'Password123!',
                type: 'SERVICE_PROVIDER',
              },
            },
          } as never
        }
      />,
    );
  });
}
async function fillProfile() {
  const profile = tree.root.find(
    node =>
      typeof node.type === 'function' && node.type.name === 'ProfileInfoStep',
  );
  await act(async () => {
    profile.props.onFormChange('fullName', 'Test Provider');
    profile.props.onFormChange('bio', 'Professional repairs');
    profile.props.onLanguageToggle('english');
    profile.props.onPickProfilePhoto();
  });
  await act(async () =>
    tree.root
      .findByType(ImagePickerModal)
      .props.onChange({ assets: [{ uri: 'file:///profile.jpg' }] }),
  );
}
test('selected catalogue ID is submitted with provider registration and advances after success', async () => {
  await mount();
  await fillProfile();
  await act(async () =>
    tree.root.findByType(DemandServiceTypeSelect).props.onChange('plumber-id'),
  );
  await act(async () => {
    await tree.root.findByType(Button).props.onPress();
  });
  expect(mockAuthenticate).toHaveBeenCalledWith(
    expect.objectContaining({
      demandServiceTypeId: 'plumber-id',
      type: 'SERVICE_PROVIDER',
      fullName: 'Test Provider',
    }),
  );
  expect(mockAuthenticate.mock.calls[0][0]).not.toHaveProperty(
    'professionalTitle',
  );
  expect(mockLogin).toHaveBeenCalled();
});
test('service type is required before sending registration', async () => {
  await mount();
  await fillProfile();
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(mockAuthenticate).not.toHaveBeenCalled();
  expect(tree.root.findByType(DemandServiceTypeSelect).props.error).toContain(
    'select your service type',
  );
});
test('resumed onboarding offers service selection before final submission', async () => {
  await mount(3);
  expect(tree.root.findByType(DemandServiceTypeSelect).props.value).toBe('');
  await act(async () =>
    tree.root.findAllByType(Button).slice(-1)[0].props.onPress(),
  );
  expect(mockOnboard).not.toHaveBeenCalled();
  expect(mockToast).toHaveBeenCalledWith(
    'Please select your service type.',
    'error',
  );
});

const workStep = () =>
  tree.root.find(
    node =>
      typeof node.type === 'function' &&
      node.type.name === 'WorkExperienceStep',
  );
const ratesStep = () =>
  tree.root.find(
    node =>
      typeof node.type === 'function' && node.type.name === 'SetRatesStep',
  );
const next = async () => {
  await act(async () =>
    tree.root.findAllByType(Button).slice(-1)[0].props.onPress(),
  );
};
async function fillWork() {
  const step = workStep();
  const job = step.props.form.experiences[0].id;
  const edu = step.props.form.educations[0].id;
  await act(async () => {
    step.props.onTotalExperienceChange('2-5');
    for (const [field, value] of Object.entries({
      jobTitle: 'Technician',
      companyName: 'Repairs',
      startDate: '2020-01-01',
      currentlyWorking: true,
    }))
      step.props.onUpdateExperience(job, field, value);
    for (const [field, value] of Object.entries({
      title: 'Diploma',
      institution: 'Institute',
      startDate: '2018-01-01',
      endDate: '2019-01-01',
      description: 'Technical training',
    }))
      step.props.onUpdateEducation(edu, field, value);
  });
}
test('step 2 cannot advance until its own required fields are valid, and errors clear as fields are corrected', async () => {
  await mount(2);
  await next();
  expect(workStep().props.errors.totalExperience).toBeDefined();
  const id = workStep().props.form.experiences[0].id;
  expect(workStep().props.errors[`experiences.${id}.jobTitle`]).toBeDefined();
  expect(mockOnboard).not.toHaveBeenCalled();
  await fillWork();
  expect(workStep().props.errors).toEqual({});
  await next();
  expect(ratesStep()).toBeDefined();
});
test('step 3 displays rate and working-area errors locally and submits only after correction', async () => {
  await mount(2);
  await fillWork();
  await next();
  await act(async () =>
    tree.root.findByType(DemandServiceTypeSelect).props.onChange('plumber-id'),
  );
  await next();
  expect(ratesStep().props.errors.hourlyRate).toBeDefined();
  const area = ratesStep().props.form.workingAreas[0].id;
  expect(ratesStep().props.errors[`workingAreas.${area}.city`]).toBeDefined();
  expect(mockOnboard).not.toHaveBeenCalled();
  expect(ratesStep().props.form.currency).toBe('BND');
  const step = ratesStep();
  await act(async () => {
    for (const [field, value] of Object.entries({
      currency: 'SGD',
      hourlyRate: '25',
      serviceCallCharge: '0',
      minimumCharge: '0',
      availabilityPreference: 'WEEKENDS',
    }))
      step.props.onFormChange(field, value);
    for (const [field, value] of Object.entries({
      address: 'Main Road',
      area: 'Central',
      city: 'Dubai',
      pinCode: '00000',
    }))
      step.props.onUpdateWorkingArea(area, field, value);
  });
  await act(async () =>
    ratesStep().props.onUpdateWorkingArea(area, 'coordinates', {
      latitude: 4.9,
      longitude: 114.9,
    }),
  );
  expect(ratesStep().props.errors).toEqual({});
  mockOnboard.mockResolvedValueOnce({ success: true });
  await next();
  expect(mockOnboard).toHaveBeenCalledWith(
    expect.objectContaining({
      currency: 'SGD',
      hourlyRate: 25,
      serviceCallCharge: 0,
      minimumCharge: 0,
      availabilityPreference: 'WEEKENDS',
    }),
  );
});
