jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
  useNavigation: () => mockNavigation,
}));
jest.mock('lucide-react-native', () =>
  Object.fromEntries(
    [
      'ArrowLeft',
      'Bell',
      'BriefcaseBusiness',
      'CalendarDays',
      'ChevronRight',
      'Clock3',
      'GraduationCap',
      'LogOut',
      'Mail',
      'MapPin',
      'Pencil',
      'ShieldCheck',
      'Wallet',
      'Wrench',
      'Camera',
      'Check',
    ].map(key => [key, () => null]),
  ),
);
jest.mock('../src/components/KeyboardWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('../src/components/CommonHeader', () => ({
  __esModule: true,
  default: ({ title, left }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        {left}
        <Text>{title}</Text>
      </View>
    );
  },
}));
jest.mock('../src/navigation/navigationRef', () => ({ resetTo: jest.fn() }));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('../src/services/ownerProfileService', () => ({
  ...jest.requireActual('../src/services/ownerProfileService'),
  useOwnerProfileService: () => ({
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile,
  }),
}));
jest.mock('../src/store/useAuth', () => {
  const { create } = require('zustand');
  return {
    useAuth: create(() => ({
      user: {
        id: 'provider',
        name: 'Actual Provider',
        email: 'real@test.local',
        profileDetails: {},
      },
      token: 'token',
      ownerType: 'SERVICE_PROVIDER',
      logout: jest.fn(),
    })),
  };
});
import React from 'react';
import { Text, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ProviderProfile from '../src/pages/ProviderProfile';
import ProviderEditProfile from '../src/pages/ProviderEditProfile';
import { useAuth } from '../src/store/useAuth';
const mockGetProfile = jest.fn(),
  mockUpdateProfile = jest.fn();
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  getParent: () => ({ navigate: jest.fn() }),
};
const profile = {
  _id: 'provider',
  type: 'SERVICE_PROVIDER',
  fullName: 'Actual Provider',
  email: 'real@test.local',
  verificationStatus: 'APPROVED',
  professionalTitle: 'Senior Electrician',
  about: 'Electrical installations and repairs',
  languages: ['English', 'Hindi'],
  serviceType: { _id: 'type', name: 'Electrician' },
  totalExperienceRange: '2-5',
  hourlyRate: 20,
  serviceCallCharge: 5,
  minimumCharge: 30,
  currency: 'BND',
  availabilityPreference: 'FLEXIBLE',
  workingAreas: [{ city: 'Bandar', area: 'Central', address: 'Central Road' }],
  workExperiences: [
    {
      jobTitle: 'Technician',
      companyName: 'Actual Company',
      startDate: '2020-01-01',
      currentlyWorking: true,
    },
  ],
  educationCertifications: [
    { title: 'Electrical Diploma', institution: 'Actual Institute' },
  ],
};
let tree: ReactTestRenderer;
const text = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
async function press(label: string) {
  let node = tree.root
    .findAllByType(Text)
    .find(item => item.props.children === label);
  while (node && !node.props.onPress) node = node.parent || undefined;
  expect(node).toBeDefined();
  await act(async () => {
    await node!.props.onPress();
  });
}
async function edit() {
  await act(async () => {
    tree = create(
      <ProviderEditProfile
        navigation={mockNavigation as never}
        route={{} as never}
      />,
    );
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({
    user: {
      id: 'provider',
      name: 'Actual Provider',
      profileDetails: {},
    } as never,
    token: 'token',
    ownerType: 'SERVICE_PROVIDER',
  });
  mockGetProfile.mockResolvedValue(profile);
  mockUpdateProfile.mockResolvedValue(profile);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('provider profile displays real service, working areas, rates and qualifications', async () => {
  await act(async () => {
    tree = create(<ProviderProfile />);
  });
  for (const value of [
    'Actual Provider',
    'Electrician',
    'BND 20.00',
    'BND 5.00',
    'BND 30.00',
    'Flexible',
    'English',
    'Central, Bandar',
    'Actual Company',
    'Electrical Diploma',
    'real@test.local',
    'Approved',
  ])
    expect(text()).toContain(value);
  expect(text()).not.toContain('Food Delivery');
  expect(text()).not.toContain('My Cards');
  await press('Edit profile');
  expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
});
test('invalid fields show errors on the edit screen without submitting', async () => {
  await edit();
  await act(async () => {
    tree.root
      .findByProps({ accessibilityLabel: 'Hourly rate (BND)' })
      .props.onChangeText('0');
  });
  await press('Save changes');
  expect(text()).toContain('Enter a rate greater than zero.');
  expect(mockUpdateProfile).not.toHaveBeenCalled();
});
test('save updates provider fields and session display name, then returns to profile', async () => {
  await edit();
  await act(async () => {
    tree.root
      .findByProps({ accessibilityLabel: 'Full name' })
      .props.onChangeText('Updated Professional');
  });
  mockUpdateProfile.mockResolvedValue({
    ...profile,
    fullName: 'Updated Professional',
  });
  await press('Save changes');
  expect(mockUpdateProfile).toHaveBeenCalledWith(
    expect.objectContaining({
      fullName: 'Updated Professional',
      languages: ['English', 'Hindi'],
      hourlyRate: 20,
      serviceCallCharge: 5,
      minimumCharge: 30,
      availabilityPreference: 'FLEXIBLE',
    }),
  );
  expect(useAuth.getState().user?.name).toBe('Updated Professional');
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
});
test('failed saves keep entered values visible and display the server error', async () => {
  await edit();
  mockUpdateProfile.mockRejectedValue(new Error('Unable to save right now'));
  await press('Save changes');
  expect(text()).toContain('Unable to save right now');
  expect(tree.root.findAllByType(TextInput).length).toBeGreaterThan(0);
  expect(mockNavigation.goBack).not.toHaveBeenCalled();
});
test('profile load errors can be retried without showing dummy user details', async () => {
  mockGetProfile.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => {
    tree = create(<ProviderProfile />);
  });
  expect(text()).toContain('Offline');
  expect(text()).not.toContain('Abdul');
  await press('Retry');
  expect(text()).toContain('Actual Provider');
});
