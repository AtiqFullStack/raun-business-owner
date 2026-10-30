jest.mock('../src/hooks/useAxios', () => ({
  __esModule: true,
  default: () => ({ fetchData: mockFetch }),
}));
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useBusinessOwnerService } from '../src/services/businessOwnerService';
const mockFetch = jest.fn();
let service: ReturnType<typeof useBusinessOwnerService>;
let tree: ReactTestRenderer;
function Harness() {
  service = useBusinessOwnerService();
  return null;
}
beforeEach(async () => {
  mockFetch.mockReset();
  await act(async () => {
    tree = create(<Harness />);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
test('uses the active public catalogue and excludes inactive entries', async () => {
  mockFetch.mockResolvedValue({
    success: true,
    data: {
      serviceTypes: [
        { _id: 'a', isActive: true },
        { _id: 'b', isActive: false },
      ],
    },
  });
  expect(await service.getDemandServiceTypes()).toEqual([
    { _id: 'a', isActive: true },
  ]);
  expect(mockFetch).toHaveBeenCalledWith({
    url: '/business-owners/demand-service-types',
    method: 'GET',
    service: false,
  });
});
test('rejects unsuccessful and malformed catalogue responses', async () => {
  for (const response of [
    { success: false, data: { serviceTypes: [] } },
    { success: true, data: {} },
  ]) {
    mockFetch.mockResolvedValueOnce(response);
    await expect(service.getDemandServiceTypes()).rejects.toThrow(
      'Unable to load service types',
    );
  }
});
test('registration forwards the chosen reference in JSON and multipart requests', async () => {
  mockFetch.mockResolvedValue({ success: true, data: {} });
  const values = {
    email: 'provider@test.local',
    password: 'Password123!',
    type: 'SERVICE_PROVIDER',
    demandServiceTypeId: 'plumber',
  };
  await service.authenticateOwner(values);
  expect(mockFetch.mock.calls[0][0].data.demandServiceTypeId).toBe('plumber');
  await service.authenticateOwner({
    ...values,
    profilePhoto: { uri: 'file:///photo.jpg' },
  });
  const form = mockFetch.mock.calls[1][0].data as FormData;
  // Jest uses Node's web FormData; the device uses React Native's FormData.
  expect(
    (form as unknown as { get: (name: string) => unknown }).get(
      'demandServiceTypeId',
    ),
  ).toBe('plumber');
});
