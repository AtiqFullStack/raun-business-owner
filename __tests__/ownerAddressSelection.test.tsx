jest.mock('lucide-react-native', () =>
  Object.fromEntries(
    ['ArrowUpRight', 'Check', 'ChevronRight', 'MapPin', 'Search', 'X'].map(
      name => [name, () => null],
    ),
  ),
);
jest.mock('../src/services/ownerPlacesService', () => ({
  useOwnerPlacesService: () => ({ search: mockSearch, details: mockDetails }),
}));
jest.mock('../src/components/InputText', () => () => null);
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import OwnerAddressFields from '../src/components/OwnerAddressFields';
import InputText from '../src/components/InputText';
const mockSearch = jest.fn(),
  mockDetails = jest.fn();
let tree: ReactTestRenderer;
const change = jest.fn(),
  coordinates = jest.fn();
const place = {
  address: 'Kiulap, Brunei',
  city: 'Bandar Seri Begawan',
  area: 'Kiulap',
  pinCode: '',
  coordinates: { latitude: 4.91, longitude: 114.93 },
};
beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockSearch.mockResolvedValue([
    { placeId: 'kiulap', label: 'Kiulap, Brunei' },
  ]);
  mockDetails.mockResolvedValue(place);
  await act(async () => {
    tree = create(
      <OwnerAddressFields
        value={{
          address: 'Old address',
          city: 'London',
          area: 'Central',
          pinCode: 'SW1',
          coordinates: { latitude: 51.5, longitude: -0.1 },
        }}
        onChange={change}
        onCoordinatesChange={coordinates}
      />,
    );
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
  jest.useRealTimers();
});
async function select(kind: string) {
  await act(async () =>
    tree.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === `Select ${kind}`)!
      .props.onPress(),
  );
  const input = tree.root
    .findAllByType(InputText)
    .find(node => node.props.label === 'Search in any country')!;
  await act(async () => input.props.onChangeText('Kiulap, Brunei'));
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
  await act(async () =>
    tree.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === 'Use Kiulap, Brunei')!
      .props.onPress(),
  );
}
test('selecting a Google address populates structured fields and coordinates together', async () => {
  await select('address');
  expect(mockSearch).toHaveBeenCalledWith(
    'Kiulap, Brunei',
    expect.any(String),
    'address',
  );
  expect(change).toHaveBeenCalledWith('city', 'Bandar Seri Begawan');
  expect(change).toHaveBeenCalledWith('area', 'Kiulap');
  expect(change).toHaveBeenCalledWith('pinCode', '');
  expect(coordinates).toHaveBeenCalledWith(place.coordinates);
});
test('changing the city clears the previous address and location so nearby data cannot become stale', async () => {
  await select('city');
  expect(change).toHaveBeenCalledWith('city', 'Bandar Seri Begawan');
  expect(change).toHaveBeenCalledWith('address', '');
  expect(change).toHaveBeenCalledWith('area', '');
  expect(coordinates).toHaveBeenCalledWith(null);
});
