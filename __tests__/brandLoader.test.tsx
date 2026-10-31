import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import BrandLoader from '../src/components/BrandLoader';
let tree: ReactTestRenderer;
let motionChanged: ((enabled: boolean) => void) | undefined;
let stateChanged: ((state: AppStateStatus) => void) | undefined;
const start = jest.fn(),
  stop = jest.fn(),
  removeMotion = jest.fn(),
  removeState = jest.fn();
beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_event: unknown, listener: unknown) => {
      motionChanged = listener as (enabled: boolean) => void;
      return { remove: removeMotion } as unknown as ReturnType<
        typeof AccessibilityInfo.addEventListener
      >;
    });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      stateChanged = listener;
      return { remove: removeState };
    });
  jest
    .spyOn(Animated, 'loop')
    .mockReturnValue({ start, stop, reset: jest.fn() });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
test('loader announces a busy state and pauses for reduced motion', async () => {
  await act(async () => {
    tree = create(<BrandLoader text="Preparing your account" />);
  });
  const root = tree.root.findByProps({ accessibilityRole: 'progressbar' });
  expect(root.props.accessibilityLabel).toBe('Preparing your account');
  expect(root.props.accessibilityState.busy).toBe(true);
  expect(start).toHaveBeenCalledTimes(1);
  await act(async () => motionChanged?.(true));
  expect(stop).toHaveBeenCalledTimes(1);
  await act(async () => motionChanged?.(false));
  expect(start).toHaveBeenCalledTimes(2);
});
test('backgrounding and unmounting stop the animation and remove native listeners', async () => {
  await act(async () => {
    tree = create(<BrandLoader text="" />);
  });
  expect(
    tree.root.findByProps({ accessibilityRole: 'progressbar' }).props
      .accessibilityLabel,
  ).toBe('Loading');
  await act(async () => stateChanged?.('background'));
  expect(stop).toHaveBeenCalledTimes(1);
  await act(async () => stateChanged?.('active'));
  expect(start).toHaveBeenCalledTimes(2);
  await act(async () => tree.unmount());
  expect(stop).toHaveBeenCalledTimes(2);
  expect(removeMotion).toHaveBeenCalledTimes(1);
  expect(removeState).toHaveBeenCalledTimes(1);
});
