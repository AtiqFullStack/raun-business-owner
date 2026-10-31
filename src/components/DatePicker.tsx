import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../styles/theme';
import { scale } from '../utils/responsive';

type DatePickerProps = {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
};
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const ROW_HEIGHT = 44;
const pad = (number: number) => String(number).padStart(2, '0');
const dateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value?: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
};
const readableDate = (date: Date) =>
  `${date.getDate()} ${MONTHS[date.getMonth()].slice(
    0,
    3,
  )} ${date.getFullYear()}`;
const clampDate = (date: Date, min: Date | null, max: Date | null) =>
  min && date < min ? min : max && date > max ? max : date;
type Option = { label: string; value: number; disabled?: boolean };

function DateColumn({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: Option[];
  onChange: (value: number) => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const centered = useRef(false);
  const showSelected = () => {
    if (centered.current) return;
    centered.current = true;
    const index = options.findIndex(option => option.value === value);
    scroll.current?.scrollTo({
      y: Math.max(0, index * ROW_HEIGHT - ROW_HEIGHT * 2),
      animated: false,
    });
  };
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        ref={scroll}
        style={styles.columnList}
        onContentSizeChange={showSelected}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${option.label}`}
            accessibilityState={{
              selected: option.value === value,
              disabled: !!option.disabled,
            }}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              option.value === value && styles.selectedOption,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                option.value === value && styles.selectedText,
                option.disabled && styles.disabledText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function DatePicker({
  label,
  error,
  placeholder = 'Select Date',
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  containerStyle,
  labelStyle,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => parseDate(value) || new Date());
  const selected = parseDate(value);
  const minimum = parseDate(minDate),
    maximum = parseDate(maxDate);
  const year = draft.getFullYear(),
    month = draft.getMonth(),
    day = draft.getDate();
  const lowerYear = minimum?.getFullYear() ?? Math.min(1900, year);
  const upperYear =
    maximum?.getFullYear() ?? Math.max(new Date().getFullYear() + 10, year);
  const years = useMemo(
    () =>
      Array.from(
        { length: Math.max(0, upperYear - lowerYear + 1) },
        (_, index) => ({
          label: String(lowerYear + index),
          value: lowerYear + index,
        }),
      ),
    [lowerYear, upperYear],
  );
  const outOfRange = (date: Date) =>
    !!((minimum && date < minimum) || (maximum && date > maximum));
  const months = MONTHS.map((name, index) => ({
    label: name.slice(0, 3),
    value: index,
    disabled: !!(
      (minimum && new Date(year, index + 1, 0) < minimum) ||
      (maximum && new Date(year, index, 1) > maximum)
    ),
  }));
  const days = Array.from(
    { length: new Date(year, month + 1, 0).getDate() },
    (_, index) => ({
      label: pad(index + 1),
      value: index + 1,
      disabled: outOfRange(new Date(year, month, index + 1)),
    }),
  );
  const update = (nextYear: number, nextMonth: number, nextDay: number) => {
    const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    setDraft(
      clampDate(
        new Date(nextYear, nextMonth, Math.min(nextDay, lastDay)),
        minimum,
        maximum,
      ),
    );
  };
  const close = () => setVisible(false);
  const open = () => {
    if (disabled) return;
    Keyboard.dismiss();
    setDraft(clampDate(parseDate(value) || new Date(), minimum, maximum));
    setVisible(true);
  };
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label || 'Select date'}
        accessibilityState={{ disabled, expanded: visible }}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={open}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          error ? styles.triggerError : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            !selected && styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {selected ? readableDate(selected) : placeholder}
        </Text>
        <Text style={styles.triggerIcon}>⌄</Text>
      </TouchableOpacity>
      {!!error && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Dismiss date picker"
            onPress={close}
          />
          {visible && (
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <ScrollView
                style={styles.body}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View>
                    <Text style={styles.eyebrow}>{label || 'DATE'}</Text>
                    <Text style={styles.title}>Choose a date</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Close date picker"
                    onPress={close}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>SELECTED DATE</Text>
                  <Text
                    accessibilityLiveRegion="polite"
                    testID="date-preview"
                    style={styles.previewDate}
                  >
                    {readableDate(draft)}
                  </Text>
                </View>
                <Text style={styles.hint}>
                  Scroll and tap a day, month and year.
                </Text>
                <View style={styles.columns}>
                  <DateColumn
                    label="Day"
                    value={day}
                    options={days}
                    onChange={nextDay => update(year, month, nextDay)}
                  />
                  <DateColumn
                    label="Month"
                    value={month}
                    options={months}
                    onChange={nextMonth => update(year, nextMonth, day)}
                  />
                  <DateColumn
                    label="Year"
                    value={year}
                    options={years}
                    onChange={nextYear => update(nextYear, month, day)}
                  />
                </View>
              </ScrollView>
              <View style={styles.footer}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={close}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Confirm date"
                  disabled={outOfRange(draft)}
                  style={[
                    styles.confirmButton,
                    outOfRange(draft) && styles.triggerDisabled,
                  ]}
                  onPress={() => {
                    onChange(dateValue(draft));
                    close();
                  }}
                >
                  <Text style={styles.confirmText}>Confirm date</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    minHeight: scale(48),
    paddingHorizontal: 12,
  },
  triggerDisabled: { backgroundColor: colors.surfaceMuted },
  triggerError: { borderColor: colors.error },
  triggerText: { flex: 1, fontSize: 14, color: colors.text },
  triggerIcon: { color: colors.textMuted, marginLeft: 6, fontSize: 18 },
  placeholder: { color: colors.placeholder },
  disabledText: { color: colors.placeholder },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  body: { flexShrink: 1 },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.borderDark,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  closeText: { color: colors.textMuted, fontSize: 24 },
  preview: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
  },
  previewLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  previewDate: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 5,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 14,
  },
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.textMuted,
  },
  columnList: {
    height: ROW_HEIGHT * 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  option: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  selectedOption: { backgroundColor: colors.primary, borderRadius: 10 },
  optionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  selectedText: { color: colors.textLight, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  confirmText: { color: colors.textLight, fontSize: 14, fontWeight: '700' },
});
