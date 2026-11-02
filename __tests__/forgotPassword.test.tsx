jest.mock('../src/components/CommonHeader', () => () => null);
jest.mock(
  '../src/components/KeyboardWrapper',
  () =>
    ({ children }: any) =>
      children,
);
jest.mock('../src/components/InputText', () => () => null);
jest.mock('../src/components/Button', () => () => null);
jest.mock('../src/services/businessOwnerService', () => ({
  isApiSuccess: (value: unknown) => value === true,
  useBusinessOwnerService: () => ({
    forgotPassword: mockSend,
    resetPassword: mockReset,
    loading: false,
  }),
}));
import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import ForgotPassword from '../src/pages/ForgotPassword';
import InputText from '../src/components/InputText';
import Button from '../src/components/Button';
const mockSend = jest.fn(),
  mockReset = jest.fn(),
  mockBack = jest.fn();
let tree: ReactTestRenderer;
const field = (label: string) =>
  tree.root.findAllByType(InputText).find(node => node.props.label === label)!;
const submit = () =>
  act(async () => tree.root.findByType(Button).props.onPress());
beforeEach(async () => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({
    success: true,
    message: 'Check your email for a reset code.',
  });
  mockReset.mockResolvedValue({ success: true });
  await act(async () => {
    tree = create(
      <ForgotPassword
        route={{ params: { email: '' } } as any}
        navigation={{ goBack: mockBack } as any}
      />,
    );
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
test('validates email, reset code and matching passwords before resetting', async () => {
  await submit();
  expect(mockSend).not.toHaveBeenCalled();
  expect(field('Email').props.error).toBeTruthy();
  await act(async () => field('Email').props.onChangeText('owner@test.local'));
  await submit();
  expect(mockSend).toHaveBeenCalledWith('owner@test.local');
  await submit();
  expect(field('Reset Code').props.error).toBeTruthy();
  expect(mockReset).not.toHaveBeenCalled();
  await act(async () => {
    field('Reset Code').props.onChangeText('123456');
    field('New Password').props.onChangeText('new-password');
    field('Confirm Password').props.onChangeText('different');
  });
  await submit();
  expect(field('Confirm Password').props.error).toBe('Passwords do not match.');
  await act(async () =>
    field('Confirm Password').props.onChangeText('new-password'),
  );
  await submit();
  expect(mockReset).toHaveBeenCalledWith({
    email: 'owner@test.local',
    otp: '123456',
    password: 'new-password',
  });
  expect(tree.root.findByType(Button).props.title).toBe('Back to Login');
  await submit();
  expect(mockBack).toHaveBeenCalled();
});
test('displays server errors and preserves the reset form for retry', async () => {
  await act(async () => field('Email').props.onChangeText('owner@test.local'));
  await submit();
  await act(async () => {
    field('Reset Code').props.onChangeText('123456');
    field('New Password').props.onChangeText('new-password');
    field('Confirm Password').props.onChangeText('new-password');
  });
  mockReset.mockRejectedValueOnce({
    message: 'This reset code is incorrect or has expired.',
  });
  await submit();
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'This reset code is incorrect or has expired.',
      ),
  ).toBe(true);
  expect(tree.root.findByType(Button).props.title).toBe('Reset Password');
});
