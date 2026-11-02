import { navigationRef } from '../navigation/navigationRef';
import { useAuth } from '../store/useAuth';
import type { DemandEvent } from '../store/useOwnerNotifications';
let pending: DemandEvent | null = null;
export function openDemandNotification(data: DemandEvent) {
  if (data.sourceModel !== 'DemandBooking' || !data.bookingId) return;
  pending = data;
  flushDemandNotification();
}
export function clearDemandNotification() {
  pending = null;
}
export function flushDemandNotification() {
  const { user } = useAuth.getState();
  if (!pending || !user?.userAuthId || !navigationRef.isReady()) return;
  const state = navigationRef.getRootState();
  if (!state.routes.some(route => route.name === 'app')) return;
  if (pending.providerId !== user.id) {
    pending = null;
    return;
  }
  const bookingId = pending.bookingId!;
  if (pending.type === 'NEW_MESSAGE') {
    const orderId = pending.orderId || bookingId;
    pending = null;
    navigationRef.navigate('BookingChat', { orderId });
    return;
  }
  pending = null;
  navigationRef.navigate('app', {
    screen: 'MyBookings',
    params: { screen: 'BookingDetails', params: { bookingId } },
  });
}
