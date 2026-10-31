import React from 'react';
import { Modal, TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import DatePicker from '../src/components/DatePicker';
let tree: ReactTestRenderer;
const change = jest.fn();
async function mount(
  props: Partial<React.ComponentProps<typeof DatePicker>> = {},
) {
  await act(async () => {
    tree = create(
      <DatePicker
        label="Start date"
        value="2024-01-31"
        onChange={change}
        {...props}
      />,
    );
  });
}
const button = (label: string) =>
  tree.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityLabel === label)!;
const press = (label: string) => act(async () => button(label).props.onPress());
const confirm = () => press('Confirm date');
afterEach(async () => {
  jest.clearAllMocks();
  await act(async () => tree?.unmount());
});
test('day, month and year selections preview without saving until confirmed, and month changes clamp invalid days', async () => {
  await mount();
  await press('Start date');
  await press('Month Feb');
  expect(tree.root.findByProps({ testID: 'date-preview' }).props.children).toBe(
    '29 Feb 2024',
  );
  await press('Year 2023');
  expect(tree.root.findByProps({ testID: 'date-preview' }).props.children).toBe(
    '28 Feb 2023',
  );
  await press('Day 07');
  expect(change).not.toHaveBeenCalled();
  await confirm();
  expect(change).toHaveBeenCalledWith('2023-02-07');
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
});
test('cancel closes without saving and reopening restores the saved date', async () => {
  await mount();
  await press('Start date');
  await press('Year 2000');
  await press('Close date picker');
  expect(change).not.toHaveBeenCalled();
  await press('Start date');
  await confirm();
  expect(change).toHaveBeenCalledWith('2024-01-31');
});
test('end date bounds disable earlier days and months and clamp the initial selection', async () => {
  await mount({
    label: 'End date',
    value: '2024-01-10',
    minDate: '2024-03-15',
    maxDate: '2024-05-20',
  });
  await press('End date');
  expect(tree.root.findByProps({ testID: 'date-preview' }).props.children).toBe(
    '15 Mar 2024',
  );
  expect(button('Month Feb').props.disabled).toBe(true);
  expect(button('Day 14').props.disabled).toBe(true);
  await press('Month May');
  expect(button('Day 21').props.disabled).toBe(true);
  await press('Day 20');
  await confirm();
  expect(change).toHaveBeenCalledWith('2024-05-20');
});
test('disabled date fields do not open and malformed saved dates are not silently normalized', async () => {
  await mount({ disabled: true });
  expect(button('Start date').props.disabled).toBe(true);
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
  await act(async () =>
    tree.update(
      <DatePicker label="Start date" value="2024-02-31" onChange={change} />,
    ),
  );
  await press('Start date');
  await confirm();
  expect(change.mock.calls[0][0]).not.toBe('2024-03-02');
});
