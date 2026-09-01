import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '../styles/theme';
import { vw } from '../utils/responsive';
import Button from '../components/Button';
import Logo from '../assets/svg/Code/Logo';
import { navigate } from '../navigation/navigationRef';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type DayConfig = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

const DEFAULT_HOURS: Record<string, DayConfig> = Object.fromEntries(
  DAYS.map((day) => [
    day,
    { enabled: day !== 'Sunday', openTime: '09:00 AM', closeTime: '10:00 PM' },
  ])
);

const TIME_OPTIONS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM',
];

export default function BusinessHours() {
  const [hours, setHours] = useState<Record<string, DayConfig>>(DEFAULT_HOURS);
  const [pickerState, setPickerState] = useState<{
    visible: boolean;
    day: string;
    field: 'openTime' | 'closeTime';
  }>({ visible: false, day: '', field: 'openTime' });

  const toggleDay = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const setTime = (day: string, field: 'openTime' | 'closeTime', time: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: time } }));
    setPickerState({ visible: false, day: '', field: 'openTime' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo />
      </View>

      {/* Step Indicator */}
      <StepIndicator current={4} total={6} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.stepTitle}>Business Hours</Text>
        <Text style={styles.stepSubtitle}>Set Your Business Hours</Text>

        {DAYS.map((day) => {
          const config = hours[day];
          return (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayLeft}>
                <Switch
                  value={config.enabled}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={config.enabled ? colors.textLight : '#f4f3f4'}
                  ios_backgroundColor={colors.border}
                />
                <Text style={[styles.dayName, !config.enabled && styles.dayDisabled]}>
                  {day.slice(0, 3)}
                </Text>
              </View>

              {config.enabled ? (
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timePill}
                    onPress={() =>
                      setPickerState({ visible: true, day, field: 'openTime' })
                    }
                  >
                    <Text style={styles.timeText}>{config.openTime}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeSep}>—</Text>
                  <TouchableOpacity
                    style={styles.timePill}
                    onPress={() =>
                      setPickerState({ visible: true, day, field: 'closeTime' })
                    }
                  >
                    <Text style={styles.timeText}>{config.closeTime}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.closedText}>Closed</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Time Picker Sheet */}
      {pickerState.visible && (
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>
            Select {pickerState.field === 'openTime' ? 'Opening' : 'Closing'} Time
          </Text>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.pickerOption,
                  hours[pickerState.day]?.[pickerState.field] === t &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => setTime(pickerState.day, pickerState.field, t)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    hours[pickerState.day]?.[pickerState.field] === t &&
                      styles.pickerOptionTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setPickerState({ visible: false, day: '', field: 'openTime' })}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigate('Documents')}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.stepDot, i < current ? styles.stepDotActive : styles.stepDotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screen },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
  },
  scroll: { paddingHorizontal: vw(5), paddingBottom: 120, paddingTop: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.screen,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: { backgroundColor: colors.primary, width: '100%' },
  stepTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { fontSize: 15, fontWeight: '600', color: colors.text, width: 40 },
  dayDisabled: { color: colors.textMuted },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  timeSep: { fontSize: 13, color: colors.textMuted },
  closedText: { fontSize: 13, color: colors.error, fontWeight: '500' },

  /* Picker Sheet */
  pickerSheet: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: colors.screen,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScroll: { maxHeight: 220 },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerOptionSelected: { backgroundColor: colors.primary },
  pickerOptionText: { fontSize: 15, color: colors.text },
  pickerOptionTextSelected: { color: colors.textLight, fontWeight: '600' },
  pickerCancel: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerCancelText: { fontSize: 15, color: colors.error, fontWeight: '600' },

  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: colors.screen,
  },
  stepDot: { height: 8, borderRadius: 4 },
  stepDotActive: { width: 24, backgroundColor: colors.primary },
  stepDotInactive: { width: 8, backgroundColor: colors.border },
});
