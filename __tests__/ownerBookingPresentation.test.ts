import {
  canContactCustomer,
  ownerBookingPresentation,
} from '../src/utils/ownerBookingPresentation';
test('owner wording identifies who ended the booking without changing its status', () => {
  expect(
    ownerBookingPresentation({
      status: 'cancelled',
      ownerDecision: 'rejected',
      cancelledBy: 'business_owner',
    }).label,
  ).toBe('You declined');
  expect(
    ownerBookingPresentation({ status: 'cancelled', cancelledBy: 'customer' })
      .label,
  ).toBe('Cancelled by customer');
  expect(
    ownerBookingPresentation({
      status: 'cancelled',
      cancelledBy: 'business_owner',
    }).label,
  ).toBe('Cancelled by you');
  expect(ownerBookingPresentation({ status: 'cancelled' }).label).toBe(
    'Cancelled',
  );
});
test('only active bookings allow customer contact', () => {
  for (const status of ['pending', 'confirmed', 'in_progress'] as const)
    expect(canContactCustomer({ status })).toBe(true);
  for (const status of ['completed', 'cancelled'] as const)
    expect(canContactCustomer({ status })).toBe(false);
});
