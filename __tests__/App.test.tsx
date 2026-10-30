jest.mock('../src/hooks/useOwnerRealtime', () => ({
  __esModule: true,
  default: () => {},
}));
jest.mock('../src/services/demandNotificationNavigation', () => ({
  flushDemandNotification: jest.fn(),
}));
/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
