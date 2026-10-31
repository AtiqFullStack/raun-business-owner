jest.mock('../src/components/Select', () => () => null);
import React, { useState } from 'react';
import { Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import OwnerAvailability from '../src/components/OwnerAvailability';
import Select from '../src/components/Select';
import type { BusinessHourPayload } from '../src/services/businessOwnerService';
let tree: ReactTestRenderer;
const changed = jest.fn();
const rows = (): BusinessHourPayload[] => [
  { day: 'MONDAY', isClosed: false, openTime: '09:00', closeTime: '18:00' },
  { day: 'TUESDAY', isClosed: false, openTime: '09:00', closeTime: '18:00' },
  { day: 'SUNDAY', isClosed: true, openTime: '10:00', closeTime: '15:00' },
];
async function mount(initial = rows()) {
  function Form() {
    const [value, setValue] = useState(initial);
    return (
      <OwnerAvailability
        value={value}
        onChange={next => {
          changed(next);
          setValue(next);
        }}
        timezone="Asia/Brunei"
      />
    );
  }
  await act(async () => {
    tree = create(<Form />);
  });
}
const day = (name: string) =>
  tree.root.findAll(
    node =>
      node.props.accessibilityLabel === `${name} available` &&
      typeof node.props.onPress === 'function',
  )[0];
const select = (label: string) =>
  tree.root.findAllByType(Select).find(node => node.props.label === label)!;
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.clearAllMocks();
});
test('shared hours edit all selected days and leave closed days untouched', async () => {
  await mount();
  expect(tree.root.findByType(Switch).props.value).toBe(true);
  expect(tree.root.findAllByType(Select)).toHaveLength(2);
  await act(async () => select('From').props.onChange('10:00'));
  const value = changed.mock.lastCall![0];
  expect(value[0].openTime).toBe('10:00');
  expect(value[1].openTime).toBe('10:00');
  expect(value[2]).toEqual(rows()[2]);
  await act(async () => day('Sunday').props.onPress());
  expect(changed.mock.lastCall![0][2]).toMatchObject({
    isClosed: false,
    openTime: '10:00',
    closeTime: '18:00',
  });
});
test('individual schedules remain intact until the same-hours switch is explicitly enabled', async () => {
  const initial = rows();
  initial[1].openTime = '11:00';
  await mount(initial);
  expect(changed).not.toHaveBeenCalled();
  expect(tree.root.findByType(Switch).props.value).toBe(false);
  expect(tree.root.findAllByType(Select)).toHaveLength(4);
  await act(async () => tree.root.findByType(Switch).props.onValueChange(true));
  expect(changed.mock.lastCall![0][1].openTime).toBe('09:00');
  await act(async () =>
    tree.root.findByType(Switch).props.onValueChange(false),
  );
  await act(async () => select('Until').props.onChange('16:00'));
  const value = changed.mock.lastCall![0];
  expect(value[0].closeTime).toBe('16:00');
  expect(value[1].closeTime).toBe('18:00');
});
test('day chips support deselection and restore hours after an empty selection', async () => {
  await mount();
  await act(async () => day('Monday').props.onPress());
  await act(async () => day('Tuesday').props.onPress());
  expect(tree.root.findAllByType(Select)).toHaveLength(0);
  expect(day('Monday').props.accessibilityState.checked).toBe(false);
  await act(async () => day('Monday').props.onPress());
  expect(day('Monday').props.accessibilityState.checked).toBe(true);
  expect(select('From').props.value).toBe('09:00');
});
