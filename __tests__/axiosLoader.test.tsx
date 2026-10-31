jest.mock('axios', () => ({
  __esModule: true,
  default: { create: () => mockClient, isAxiosError: () => false },
}));
jest.mock('../src/store/useAuth', () => ({
  useAuth: (select: any) => select({ token: null }),
}));
jest.mock('../src/store/useService', () => ({
  useServiceStore: { getState: () => ({ selectedServiceId: null }) },
}));
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import useAxios, { type LoaderOptions } from '../src/hooks/useAxios';
import { useLoader } from '../src/store/useLoader';
const mockClient = { defaults: { baseURL: 'test' }, request: jest.fn() };
let first: ReturnType<typeof useAxios>,
  second: ReturnType<typeof useAxios>,
  tree: ReactTestRenderer;
const visibleCount = () => Object.keys(useLoader.getState().loaders).length;
async function mount(options?: LoaderOptions) {
  function Harness() {
    first = useAxios(options);
    second = useAxios();
    return null;
  }
  await act(async () => {
    tree = create(<Harness />);
  });
}
beforeEach(() => {
  useLoader.setState({ loaders: {} });
  mockClient.request.mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const result = { data: { success: true, data: { saved: true } } };
test('loader is opt-in and per-request options override hook defaults without being sent to Axios', async () => {
  const pending = deferred();
  mockClient.request.mockReturnValue(pending.promise);
  await mount({ showLoader: true, loaderText: 'Saving...' });
  let quiet!: Promise<unknown>;
  act(() => {
    quiet = first.fetchData({ url: '/quiet', showLoader: false });
  });
  expect(visibleCount()).toBe(0);
  expect(first.loading).toBe(true);
  await act(async () => {
    pending.resolve(result);
    await quiet;
  });
  const next = deferred();
  mockClient.request.mockReturnValue(next.promise);
  let request!: Promise<unknown>;
  act(() => {
    request = first.fetchData({ url: '/save' });
  });
  expect(Object.values(useLoader.getState().loaders)).toEqual(['Saving...']);
  expect(mockClient.request.mock.lastCall![0]).not.toHaveProperty('showLoader');
  expect(mockClient.request.mock.lastCall![0]).not.toHaveProperty('loaderText');
  await act(async () => {
    next.resolve(result);
    await request;
  });
  expect(visibleCount()).toBe(0);
  mockClient.request.mockResolvedValue(result);
  await act(async () => {
    await second.fetchData({ url: '/default' });
  });
  expect(visibleCount()).toBe(0);
});
test('parallel requests from different hooks keep their own loader until both finish', async () => {
  const one = deferred(),
    two = deferred();
  mockClient.request
    .mockReturnValueOnce(one.promise)
    .mockReturnValueOnce(two.promise);
  await mount();
  let a!: Promise<unknown>, b!: Promise<unknown>;
  act(() => {
    a = first.fetchData({ url: '/one', showLoader: true, loaderText: 'First' });
    b = second.fetchData({
      url: '/two',
      showLoader: true,
      loaderText: 'Second',
    });
  });
  expect(visibleCount()).toBe(2);
  await act(async () => {
    two.resolve(result);
    await b;
  });
  expect(Object.values(useLoader.getState().loaders)).toEqual(['First']);
  await act(async () => {
    one.resolve(result);
    await a;
  });
  expect(visibleCount()).toBe(0);
});
test('failed requests release the loader and preserve the normalized error', async () => {
  const pending = deferred();
  mockClient.request.mockReturnValue(pending.promise);
  await mount();
  let request!: Promise<unknown>;
  act(() => {
    request = first
      .fetchData({ url: '/fail', showLoader: true })
      .catch(error => error);
  });
  expect(visibleCount()).toBe(1);
  let error: unknown;
  await act(async () => {
    pending.reject(new Error('Network unavailable'));
    error = await request;
  });
  expect(error).toEqual({ message: 'Network unavailable' });
  expect(visibleCount()).toBe(0);
  expect(first.loading).toBe(false);
});
