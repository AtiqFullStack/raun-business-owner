import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Select from './Select';
import timezones from '../assets/data/timezones.json';
import { colors } from '../styles/theme';
import { TIME_OPTIONS } from '../utils/ownerAvailability';
import type { BusinessHourPayload } from '../services/businessOwnerService';

type Props = {
  value: BusinessHourPayload[];
  onChange: (value: BusinessHourPayload[]) => void;
  timezone: string;
  onTimezoneChange?: (value: string) => void;
  error?: string;
};
const dayName = (day: string) => day[0] + day.slice(1).toLowerCase();
const sameHours = (days: BusinessHourPayload[]) =>
  days.length > 0 &&
  days.every(
    day =>
      day.openTime === days[0].openTime && day.closeTime === days[0].closeTime,
  );

export default function OwnerAvailability({
  value,
  onChange,
  timezone,
  error,
  onTimezoneChange,
}: Props) {
  const activeDays = value.filter(day => !day.isClosed);
  const [hoursMode, setHoursMode] = useState(() =>
    sameHours(activeDays) ? 'shared' : 'individual',
  );
  const shared = hoursMode === 'shared' && sameHours(activeDays);
  const change = (day: string, patch: Partial<BusinessHourPayload>) =>
    onChange(value.map(row => (row.day === day ? { ...row, ...patch } : row)));
  const toggleDay = (day: BusinessHourPayload) =>
    change(day.day, {
      isClosed: !day.isClosed,
      ...(day.isClosed
        ? {
            openTime: shared ? activeDays[0].openTime : day.openTime || '09:00',
            closeTime: shared
              ? activeDays[0].closeTime
              : day.closeTime || '18:00',
          }
        : {}),
    });
  const setShared = (enabled: boolean) => {
    setHoursMode(enabled ? 'shared' : 'individual');
    if (enabled && activeDays.length)
      onChange(
        value.map(day =>
          day.isClosed
            ? day
            : {
                ...day,
                openTime: activeDays[0].openTime,
                closeTime: activeDays[0].closeTime,
              },
        ),
      );
  };
  const changeSharedHours = (patch: Partial<BusinessHourPayload>) =>
    onChange(value.map(day => (day.isClosed ? day : { ...day, ...patch })));
  return (
    <View style={[styles.container,{
      marginTop:15
    }]}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>Your weekly availability</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{activeDays.length} / 7 days</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        Choose the days you’re available for bookings.
      </Text>
      <View style={styles.days}>
        {value.map(day => (
          <Pressable
            key={day.day}
            accessibilityRole="checkbox"
            accessibilityLabel={`${dayName(day.day)} available`}
            accessibilityState={{ checked: !day.isClosed }}
            onPress={() => toggleDay(day)}
            style={({ pressed }) => [
              styles.dayChip,
              !day.isClosed && styles.daySelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                !day.isClosed && styles.dayLabelSelected,
              ]}
            >
              {dayName(day.day).slice(0, 3)}
            </Text>
            <View
              style={[
                styles.dayIndicator,
                !day.isClosed && styles.indicatorSelected,
              ]}
            >
              <Text
                style={[
                  styles.indicatorText,
                  !day.isClosed && styles.indicatorTextSelected,
                ]}
              >
                {day.isClosed ? '+' : '✓'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      {activeDays.length ? (
        <>
          <View style={styles.hoursCard}>
            <View style={styles.hoursHeader}>
              <View style={styles.hoursHeaderText}>
                <Text style={styles.sectionTitle}>Working hours</Text>
                <Text style={styles.help}>
                  Set when customers can book you.
                </Text>
              </View>
              <View style={styles.statusDot} />
            </View>
            {activeDays.length > 1 && (
              <View style={styles.sharedRow}>
                <View style={styles.hoursHeaderText}>
                  <Text style={styles.sharedTitle}>
                    Same hours on selected days
                  </Text>
                  <Text style={styles.help}>
                    Set your timings once for all days.
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Use same hours on selected days"
                  value={shared}
                  onValueChange={setShared}
                  trackColor={{
                    true: colors.primary,
                    false: colors.borderDark,
                  }}
                />
              </View>
            )}
            {shared ? (
              <View style={styles.timeGroup}>
                <Text style={styles.timeGroupLabel}>
                  {activeDays.length === 1
                    ? dayName(activeDays[0].day)
                    : 'ALL SELECTED DAYS'}
                </Text>
                <View style={styles.timeRow}>
                  <Select
                    label="From"
                    options={TIME_OPTIONS}
                    value={activeDays[0].openTime}
                    onChange={openTime => changeSharedHours({ openTime })}
                    containerStyle={styles.timeSelect}
                  />
                  <View style={styles.timeDash} />
                  <Select
                    label="Until"
                    options={TIME_OPTIONS}
                    value={activeDays[0].closeTime}
                    onChange={closeTime => changeSharedHours({ closeTime })}
                    containerStyle={styles.timeSelect}
                  />
                </View>
              </View>
            ) : (
              activeDays.map(day => (
                <View key={day.day} style={styles.individualDay}>
                  <View style={styles.individualHeading}>
                    <View style={styles.smallDot} />
                    <Text style={styles.timeGroupLabel}>
                      {dayName(day.day)}
                    </Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Select
                      label="From"
                      options={TIME_OPTIONS}
                      value={day.openTime}
                      onChange={openTime => change(day.day, { openTime })}
                      containerStyle={styles.timeSelect}
                    />
                    <View style={styles.timeDash} />
                    <Select
                      label="Until"
                      options={TIME_OPTIONS}
                      value={day.closeTime}
                      onChange={closeTime => change(day.day, { closeTime })}
                      containerStyle={styles.timeSelect}
                    />
                  </View>
                </View>
              ))
            )}
            <Text style={styles.bookingNote}>
              Bookings use one-hour slots within these times.
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Select your available days</Text>
          <Text style={styles.help}>
            Tap a day above to add your working hours.
          </Text>
        </View>
      )}
      <View style={styles.timezone}>
        {onTimezoneChange ? (
          <Select
            label="Time zone"
            searchable
            options={[...new Set([timezone, ...timezones])].map(zone => ({
              label: zone.replace(/_/g, ' '),
              value: zone,
            }))}
            value={timezone}
            onChange={onTimezoneChange}
            containerStyle={styles.timezoneSelect}
          />
        ) : (
          <Text style={styles.help}>
            Times shown in {timezone.replace(/_/g, ' ')}
          </Text>
        )}
      </View>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  count: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 14,
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  dayChip: {
    width: '22%',
    minHeight: 68,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  dayLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  dayLabelSelected: { color: colors.textLight },
  dayIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  indicatorSelected: { backgroundColor: '#FFFFFF26', borderColor: '#FFFFFF4D' },
  indicatorText: { fontSize: 12, lineHeight: 15, color: colors.textMuted },
  indicatorTextSelected: { color: colors.textLight },
  hoursCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.surfaceMuted,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  hoursHeaderText: { flex: 1 },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  help: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  statusDot: {
    width: 9,
    height: 9,
    backgroundColor: colors.success,
    borderRadius: 5,
  },
  sharedRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  sharedTitle: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 3,
  },
  timeGroup: { paddingTop: 14 },
  timeGroupLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  timeSelect: { flex: 1, marginBottom: 0 },
  timeDash: {
    width: 8,
    height: 1,
    backgroundColor: colors.borderDark,
    marginTop: 22,
  },
  individualDay: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  individualHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  bookingNote: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 14,
  },
  timezone: { marginTop: 16 },
  timezoneSelect: { marginBottom: 0 },
  empty: {
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    padding: 18,
    gap: 6,
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 10 },
});
