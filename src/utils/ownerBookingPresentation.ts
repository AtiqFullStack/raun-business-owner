import type { DemandBooking } from '../services/demandBookingService';
type BookingState = Pick<
  DemandBooking,
  'status' | 'ownerDecision' | 'cancelledBy'
>;
export const canContactCustomer = (booking: BookingState) =>
  ['pending', 'confirmed', 'in_progress'].includes(booking.status);
export function ownerBookingPresentation(booking: BookingState) {
  switch (booking.status) {
    case 'pending':
      return {
        label: 'New request',
        description: 'Review this request and accept or decline.',
        color: '#945A12',
        background: '#FFF5DF',
      };
    case 'confirmed':
      return {
        label: 'Accepted',
        description:
          'You accepted this booking. Start the service when you arrive.',
        color: '#21674E',
        background: '#E8F5ED',
      };
    case 'in_progress':
      return {
        label: 'Ongoing',
        description: 'Your service is in progress.',
        color: '#315D9B',
        background: '#EBF2FC',
      };
    case 'completed':
      return {
        label: 'Completed',
        description: 'You completed this service.',
        color: '#21674E',
        background: '#E8F5ED',
      };
    case 'cancelled':
      return {
        label:
          booking.ownerDecision === 'rejected'
            ? 'You declined'
            : booking.cancelledBy === 'customer'
            ? 'Cancelled by customer'
            : booking.cancelledBy === 'business_owner'
            ? 'Cancelled by you'
            : 'Cancelled',
        description:
          booking.ownerDecision === 'rejected'
            ? 'You declined this booking.'
            : booking.cancelledBy === 'customer'
            ? 'The customer cancelled this booking.'
            : booking.cancelledBy === 'business_owner'
            ? 'You cancelled this booking.'
            : 'This booking was cancelled.',
        color: '#A2473D',
        background: '#FCEFEB',
      };
  }
}

export function ownerBookingReason(
  booking: Pick<DemandBooking, 'cancellationReason'>,
) {
  const reason = booking.cancellationReason?.trim() || '';
  return ['Declined by provider', 'Booking cancelled'].includes(reason)
    ? ''
    : reason;
}
