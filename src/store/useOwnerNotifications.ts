import { create } from 'zustand';
export type DemandEvent = {
  sourceModel?: string;
  bookingId?: string;
  sourceId?: string;
  providerId?: string;
  customerId?: string;
  status?: string;
  title?: string;
  body?: string;
};
type Notice = DemandEvent & { key: string; receivedAt: string };
export const useOwnerNotifications = create<{
  ownerId: string | null;
  items: Notice[];
  reset: (id: string | null) => void;
  receive: (event: DemandEvent) => boolean;
}>((set, get) => ({
  ownerId: null,
  items: [],
  reset: ownerId => set({ ownerId, items: [] }),
  receive: event => {
    const state = get();
    if (
      !state.ownerId ||
      event.sourceModel !== 'DemandBooking' ||
      event.providerId !== state.ownerId ||
      !event.bookingId
    )
      return false;
    const key = `${event.bookingId}:${event.status}`;
    if (state.items.some(item => item.key === key)) return false;
    set({
      items: [
        { ...event, key, receivedAt: new Date().toISOString() },
        ...state.items,
      ].slice(0, 50),
    });
    return true;
  },
}));
