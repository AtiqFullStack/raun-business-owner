import { formatMoney } from '../utils/currency';
import { useCallback } from 'react';
import useAxios from '../hooks/useAxios';
import { isApiSuccess } from './businessOwnerService';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type DemandBooking = {
  _id: string;
  unifiedOrderId: string;
  bookingNumber: string;
  providerId: string;
  customerId: string;
  serviceTypeName: string;
  scheduledAt: string;
  status: BookingStatus;
  customer?: { name: string; phoneNumber: string; profilePhoto?: string };
  notes?: string;
  cancellationReason?: string;
  ownerDecision?: 'accepted' | 'rejected';
  estimate: {
    totalAmount: number;
    currency: string;
    durationMinutes: number;
    hourlyRate?: number;
    serviceCallCharge?: number;
    minimumCharge?: number;
    taxAmount?: number;
  };
  paymentMethod?: 'CASH_ON_SERVICE';
  paymentStatus?: 'unpaid' | 'paid';
  serviceAddress: {
    formattedAddress: string;
    contactName?: string;
    phoneNumber?: string;
    latitude?: number;
    longitude?: number;
  };
};
export const bookingStatusLabel = (status: BookingStatus) =>
  ({
    pending: 'New',
    confirmed: 'Accepted',
    in_progress: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }[status]);
export const bookingAmount = (booking: DemandBooking) =>
  formatMoney(booking.estimate.totalAmount, booking.estimate.currency);
export type DemandDashboardData = {
  profile: { name: string; currency: string };
  metrics: {
    bookings: number;
    completed: number;
    newBookings: number;
    pending: number;
    cancelled: number;
    revenueToday: { currency: string; amount: number }[];
  };
  today: DemandBooking[];
  todayTotal: number;
  upcoming: DemandBooking[];
};
export function useDemandBookingService() {
  const { fetchData } = useAxios();
  const getDashboard = useCallback(async () => {
    const result = await fetchData<DemandDashboardData>({
      url: '/business-owners/demand-bookings/dashboard',
      params: { utcOffsetMinutes: -new Date().getTimezoneOffset() },
      service: false,
    });
    if (
      !isApiSuccess(result.success) ||
      !result.data?.metrics ||
      !Array.isArray(result.data.metrics.revenueToday) ||
      !result.data.profile?.currency ||
      !Array.isArray(result.data?.upcoming)
    )
      throw new Error(result.message || 'Unable to load dashboard.');
    return result.data;
  }, [fetchData]);
  const getBookings = useCallback(
    async (
      status: BookingStatus | 'all' = 'pending',
      page = 1,
      search = '',
      period?: 'today',
    ) => {
      const result = await fetchData<{
        bookings: DemandBooking[];
        pagination: { page: number; totalPages: number; total: number };
      }>({
        url: '/business-owners/demand-bookings',
        params: {
          status,
          page,
          limit: 20,
          ...(search ? { search } : {}),
          ...(period
            ? { period, utcOffsetMinutes: -new Date().getTimezoneOffset() }
            : {}),
        },
        service: false,
      });
      if (
        !isApiSuccess(result.success) ||
        !Array.isArray(result.data?.bookings)
      )
        throw new Error(result.message || 'Unable to load bookings.');
      return result.data;
    },
    [fetchData],
  );
  const getBooking = useCallback(
    async (id: string) => {
      const result = await fetchData<{ booking: DemandBooking }>({
        url: `/business-owners/demand-bookings/${id}`,
        service: false,
      });
      if (!isApiSuccess(result.success) || result.data?.booking?._id !== id)
        throw new Error(result.message || 'Booking not found.');
      return result.data.booking;
    },
    [fetchData],
  );
  const updateBooking = useCallback(
    async (
      id: string,
      action: 'accept' | 'reject' | 'start' | 'complete',
      reason?: string,
    ) => {
      const result = await fetchData<{ booking: DemandBooking }>({
        url: `/business-owners/demand-bookings/${id}/${action}`,
        method: 'PATCH',
        data: { reason },
        service: false,
      });
      if (!isApiSuccess(result.success) || !result.data?.booking?._id)
        throw new Error(result.message || 'Unable to update booking.');
      return result.data.booking;
    },
    [fetchData],
  );
  return { getDashboard, getBookings, getBooking, updateBooking };
}
