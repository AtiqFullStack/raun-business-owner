import type { BusinessHourPayload } from '../services/businessOwnerService';
export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const value = `${String(Math.floor(index / 2)).padStart(2, '0')}:${
    index % 2 ? '30' : '00'
  }`;
  return { label: value, value };
});
export const defaultAvailability = (
  preference = 'FULL_TIME',
): BusinessHourPayload[] =>
  WEEK_DAYS.map(day => ({
    day,
    isClosed:
      preference === 'WEEKENDS'
        ? !['SATURDAY', 'SUNDAY'].includes(day)
        : day === 'SUNDAY',
    openTime: '09:00',
    closeTime: preference === 'PART_TIME' ? '13:00' : '18:00',
  }));
const minutes = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export const availabilityError = (hours: BusinessHourPayload[]) => {
  if (!hours.some(day => !day.isClosed))
    return 'Select at least one available day.';
  if (
    hours.some(
      day =>
        !day.isClosed &&
        (!/^([01]\d|2[0-3]):[03]0$/.test(day.openTime) ||
          !/^([01]\d|2[0-3]):[03]0$/.test(day.closeTime) ||
          minutes(day.closeTime) - minutes(day.openTime) < 60),
    )
  )
    return 'Each available day needs a closing time at least one hour after opening.';
  return '';
};
