jest.mock('lucide-react-native', () => ({
  Eye: () => null,
  EyeOff: () => null,
}));
jest.mock('../src/navigation/navigationRef', () => ({ resetTo: jest.fn() }));
jest.mock('../src/store/useAuth', () => ({
  useAuth: (select: any) =>
    select({ login: mockLogin, isProfileCompleted: null }),
}));
jest.mock('../src/store/useToast', () => ({
  useToast: (select: any) => select({ showToast: jest.fn() }),
}));
jest.mock('../src/services/businessOwnerService', () => ({
  isApiSuccess: (value: unknown) => value === true,
  useBusinessOwnerService: () => ({
    authenticateOwner: mockAuthenticate,
    loading: false,
    clearError: jest.fn(),
  }),
}));
jest.mock('../src/components/InputText', () => () => null);
jest.mock('../src/components/Button', () => () => null);
jest.mock(
  '../src/components/KeyboardWrapper',
  () =>
    ({ children }: any) =>
      children,
);
jest.mock('../src/assets/svg', () => ({
  EmailSvg: () => null,
  LockSvg: () => null,
}));
jest.mock('../src/assets/svg/Code/Logo', () => () => null);
jest.mock('../src/assets/svg/Code/PartnerSvg', () => () => null);
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import Login from '../src/pages/Login';
import InputText from '../src/components/InputText';
import Button from '../src/components/Button';
import { resetTo } from '../src/navigation/navigationRef';
const mockAuthenticate = jest.fn(),
  mockLogin = jest.fn();
let tree: ReactTestRenderer;
const field = (label: string) =>
  tree.root.findAllByType(InputText).find(row => row.props.label === label)!;
const submit = () =>
  act(async () => tree.root.findByType(Button).props.onPress());
const missingType = {
  success: false,
  code: 400,
  type: 'VALIDATION_ERROR',
  message: 'Service type is required',
  data: null,
};
beforeEach(async () => {
  jest.clearAllMocks();
  mockAuthenticate.mockResolvedValue(missingType);
  await act(async () => {
    tree = create(<Login />);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
async function fillCredentials() {
  await act(async () => {
    field('Email').props.onChangeText('owner@test.local');
    field('Password').props.onChangeText('Password123!');
  });
}
test('signup uses the same form and API and carries a normalized mobile through onboarding', async () => {
  expect(tree.root.findByType(Button).props.title).toBe('Login');
  await act(async () => tree.root.findByType(TouchableOpacity).props.onPress());
  expect(tree.root.findByType(Button).props.title).toBe('Sign Up');
  await fillCredentials();
  await submit();
  expect(mockAuthenticate).not.toHaveBeenCalled();
  expect(field('Mobile Number').props.error).toBeTruthy();
  await act(async () => field('Mobile Number').props.onChangeText('8123456'));
  await submit();
  expect(mockAuthenticate).toHaveBeenCalledWith({
    email: 'owner@test.local',
    password: 'Password123!',
    phoneNumber: '8123456',
  });
  expect(resetTo).toHaveBeenCalledWith('tellBusiness', {
    authDraft: {
      email: 'owner@test.local',
      password: 'Password123!',
      phoneNumber: '8123456',
    },
  });
});
test('new users entering via login are prompted for a mobile number before registration', async () => {
  await fillCredentials();
  await submit();
  expect(tree.root.findByType(Button).props.title).toBe('Sign Up');
  expect(field('Mobile Number')).toBeDefined();
  expect(resetTo).not.toHaveBeenCalled();
});
test('existing users still log in without entering a mobile number', async () => {
  mockAuthenticate.mockResolvedValueOnce({
    success: true,
    data: {
      token: 'token',
      owner: {
        _id: 'owner',
        email: 'owner@test.local',
        role: 'BUSINESS_OWNER',
        type: 'BUSINESS',
        isProfileCompleted: true,
        phoneNumber: '+6738123456',
      },
    },
  });
  await fillCredentials();
  await submit();
  expect(mockAuthenticate).toHaveBeenCalledWith({
    email: 'owner@test.local',
    password: 'Password123!',
  });
  expect(mockLogin.mock.calls[0][0].profileDetails.phoneNumber).toBe(
    '+6738123456',
  );
  expect(resetTo).toHaveBeenCalledWith('app');
});

test('mobile input accepts seven to ten digits and limits typing to ten digits', async () => {
  await act(async () => tree.root.findByType(TouchableOpacity).props.onPress());
  await fillCredentials();
  expect(field('Mobile Number').props.maxLength).toBe(10);
  await act(async () => field('Mobile Number').props.onChangeText('123456'));
  await submit();
  expect(mockAuthenticate).not.toHaveBeenCalled();
  expect(field('Mobile Number').props.error).toContain('7 to 10');
  await act(async () =>
    field('Mobile Number').props.onChangeText('12345678901'),
  );
  expect(field('Mobile Number').props.value).toBe('1234567890');
  await submit();
  expect(mockAuthenticate).toHaveBeenCalledWith(
    expect.objectContaining({ phoneNumber: '1234567890' }),
  );
});
