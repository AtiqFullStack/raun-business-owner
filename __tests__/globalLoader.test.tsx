jest.mock('../src/components/BrandLoader', () => () => null);
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import GlobalLoader from '../src/components/BrandLoader/GlobalLoader';
import BrandLoader from '../src/components/BrandLoader';
import { useLoader } from '../src/store/useLoader';
let tree: ReactTestRenderer;
beforeEach(() => useLoader.setState({ loaders: {} }));
afterEach(async () => {
  await act(async () => tree?.unmount());
});
test('absolute overlay leaves the content mounted and manual tokens cannot hide other requests', async () => {
  const mounted = jest.fn();
  function Content() {
    useEffect(mounted, []);
    return <Text>Current screen</Text>;
  }
  await act(async () => {
    tree = create(
      <>
        <Content />
        <GlobalLoader />
      </>,
    );
  });
  expect(tree.root.findAllByType(BrandLoader)).toHaveLength(0);
  let first = '',
    second = '';
  await act(async () => {
    first = useLoader.getState().showLoader('Uploading');
    second = useLoader.getState().showLoader('Saving');
  });
  expect(
    tree.root.findByProps({ accessibilityRole: 'progressbar' }).props
      .accessibilityLabel,
  ).toBe('Saving');
  expect(tree.root.findByType(BrandLoader).props.text).toBe('');
  const overlay = tree.root.findByProps({ testID: 'global-loader-overlay' });
  expect(StyleSheet.flatten(overlay.props.style)).toMatchObject({
    position: 'absolute',
    backgroundColor: 'transparent',
  });
  expect(StyleSheet.flatten(overlay.props.style).elevation).toBeUndefined();
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Current screen'),
  ).toBe(true);
  await act(async () => {
    useLoader.getState().hideLoader(second);
    useLoader.getState().hideLoader(second);
  });
  expect(
    tree.root.findByProps({ accessibilityRole: 'progressbar' }).props
      .accessibilityLabel,
  ).toBe('Uploading');
  await act(async () => useLoader.getState().hideLoader(first));
  expect(tree.root.findAllByType(BrandLoader)).toHaveLength(0);
  expect(mounted).toHaveBeenCalledTimes(1);
});
