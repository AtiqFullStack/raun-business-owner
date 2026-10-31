import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Select from './Select';
import timezones from '../assets/data/timezones.json';
import { colors } from '../styles/theme';
import { TIME_OPTIONS } from '../utils/ownerAvailability';
import type { BusinessHourPayload } from '../services/businessOwnerService';
export default function OwnerAvailability({
  value,
  onChange,
  timezone,
  error,
  onTimezoneChange,
}: {
  value: BusinessHourPayload[];
  onChange: (value: BusinessHourPayload[]) => void;
  timezone: string;
  onTimezoneChange?: (value: string) => void;
  error?: string;
}) {
  const change = (day: string, patch: Partial<BusinessHourPayload>) =>
    onChange(value.map(row => (row.day === day ? { ...row, ...patch } : row)));
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>Available days & hours</Text>
      <Text style={styles.hint}>
        Times in {timezone}. Customers can book one-hour slots within these
        hours.
      </Text>
      {onTimezoneChange && (
        <Select
          label="Time zone"
          searchable
          options={[...new Set([timezone, ...timezones])].map(zone => ({
            label: zone.replace(/_/g, ' '),
            value: zone,
          }))}
          value={timezone}
          onChange={onTimezoneChange}
        />
      )}
      {value.map(row => (
        <View key={row.day} style={styles.day}>
          <View style={styles.row}>
            <Text style={styles.label}>
              {row.day[0] + row.day.slice(1).toLowerCase()}
            </Text>
            <Text style={styles.hint}>
              {row.isClosed ? 'Unavailable' : 'Available'}
            </Text>
            <Switch
              accessibilityLabel={`${row.day} available`}
              value={!row.isClosed}
              onValueChange={enabled => change(row.day, { isClosed: !enabled })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          {!row.isClosed && (
            <View style={styles.row}>
              <Select
                containerStyle={styles.half}
                label="From"
                value={row.openTime}
                options={TIME_OPTIONS}
                onChange={openTime => change(row.day, { openTime })}
              />
              <Select
                containerStyle={styles.half}
                label="Until"
                value={row.closeTime}
                options={TIME_OPTIONS}
                onChange={closeTime => change(row.day, { closeTime })}
              />
            </View>
          )}
        </View>
      ))}
      {!!error && (
        <Text style={{ color: colors.error, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  label: { color: colors.text, fontSize: 14, fontWeight: '500' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  day: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  half: { flex: 1, marginTop: 10, marginBottom: 4 },
});
