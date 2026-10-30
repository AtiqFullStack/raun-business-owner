jest.mock('../src/services/businessOwnerService', () => ({
  useBusinessOwnerService: () => ({ getDemandServiceTypes: mockGetTypes }),
}));
import React from 'react';
import { Image, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import DemandServiceTypeSelect from '../src/components/DemandServiceTypeSelect';
import Select from '../src/components/Select';
const mockGetTypes = jest.fn();
const onChange = jest.fn();
let tree: ReactTestRenderer;
const items = [
  {
    _id: 'plumber',
    name: 'Plumber',
    description: 'Pipe installation and repairs.',
    icon: '/uploads/demand-service-types/plumber.png',
    isActive: true,
  },
];
const texts = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .join(' ');
beforeEach(() => {
  jest.clearAllMocks();
  mockGetTypes.mockResolvedValue(items);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});
async function mount(value = '') {
  await act(async () => {
    tree = create(
      <DemandServiceTypeSelect value={value} onChange={onChange} />,
    );
  });
}
test('lists admin types by ID and displays the selected short description', async () => {
  await mount('plumber');
  const select = tree.root.findByType(Select);
  expect(select.props.options).toEqual([
    {
      label: 'Plumber',
      value: 'plumber',
      description: items[0].description,
      icon: items[0].icon,
    },
  ]);
  expect(texts()).toContain(items[0].description);
  await act(async () => select.props.onChange('plumber'));
  expect(onChange).toHaveBeenCalledWith('plumber');
});
test('loading prevents selection and failed loads can be retried', async () => {
  let finish!: (result: typeof items) => void;
  mockGetTypes.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await mount();
  expect(tree.root.findByType(Select).props.disabled).toBe(true);
  await act(async () => finish(items));
  expect(tree.root.findByType(Select).props.disabled).toBe(false);
  mockGetTypes.mockRejectedValueOnce(new Error('Connection lost'));
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: 'Refresh service types' })
      .props.onPress(),
  );
  expect(texts()).toContain('Connection lost');
  expect(tree.root.findByType(Select).props.disabled).toBe(true);
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: 'Refresh service types' })
      .props.onPress(),
  );
  expect(tree.root.findByType(Select).props.disabled).toBe(false);
});
test('empty catalogue and a removed selection show useful states', async () => {
  mockGetTypes.mockResolvedValue([]);
  await mount('removed');
  expect(texts()).toContain('No service types are available yet.');
  expect(tree.root.findByType(Select).props.error).toContain(
    'no longer available',
  );
  expect(tree.root.findByType(Select).props.disabled).toBe(true);
});

test('selected service renders its uploaded icon and falls back if the image fails', async () => {
  await mount('plumber');
  const icon = tree.root
    .findAllByType(Image)
    .find(node => node.props.source?.uri?.endsWith('/plumber.png'));
  expect(icon).toBeDefined();
  await act(async () => icon!.props.onError());
  expect(texts()).toContain('◇');
});
