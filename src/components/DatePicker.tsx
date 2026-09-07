import React, { useMemo, useState } from 'react';
import {
  Modal,
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
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
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

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const YEAR_PAGE_SIZE = 12;

const pad = (value: number) => String(value).padStart(2, '0');

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateValue = (value?: string) => {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

const getYearPageStart = (year: number) =>
  Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;

export default function DatePicker({
  label,
  placeholder = 'Select Date',
  value,
  onChange,
  disabled = false,
  containerStyle,
  labelStyle,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart(parseDateValue(value).getFullYear()),
  );

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const selectedValue = value || '';

  const yearOptions = useMemo(
    () =>
      Array.from({ length: YEAR_PAGE_SIZE }, (_, index) => yearPageStart + index),
    [yearPageStart],
  );

  const dates = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [viewDate]);

  const openPicker = () => {
    if (disabled) {
      return;
    }

    setViewDate(parseDateValue(value));
    setYearPageStart(getYearPageStart(parseDateValue(value).getFullYear()));
    setShowYearPicker(false);
    setVisible(true);
  };

  const changeMonth = (offset: number) => {
    setViewDate(
      current =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  const changeYearPage = (offset: number) => {
    setYearPageStart(current => current + offset * YEAR_PAGE_SIZE);
  };

  const handleSelectYear = (year: number) => {
    setViewDate(current => new Date(year, current.getMonth(), 1));
    setYearPageStart(getYearPageStart(year));
    setShowYearPicker(false);
  };

  const handleSelect = (date: Date) => {
    onChange(toDateValue(date));
    setVisible(false);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={openPicker}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedValue && styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {selectedValue || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.navButton}
                onPress={() =>
                  showYearPicker ? changeYearPage(-1) : changeMonth(-1)
                }
              >
                <Text style={styles.navButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.monthTitleButton}
                onPress={() => setShowYearPicker(current => !current)}
              >
                <Text style={styles.monthTitle}>
                  {showYearPicker
                    ? `${yearPageStart} - ${
                        yearPageStart + YEAR_PAGE_SIZE - 1
                      }`
                    : `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.navButton}
                onPress={() =>
                  showYearPicker ? changeYearPage(1) : changeMonth(1)
                }
              >
                <Text style={styles.navButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            {showYearPicker ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.yearGrid}
              >
                {yearOptions.map(year => {
                  const isSelectedYear =
                    selectedValue && year === selectedDate.getFullYear();
                  const isViewedYear = year === viewDate.getFullYear();

                  return (
                    <TouchableOpacity
                      key={year}
                      activeOpacity={0.75}
                      style={[
                        styles.yearCell,
                        isViewedYear ? styles.yearCellViewed : null,
                        isSelectedYear ? styles.yearCellSelected : null,
                      ]}
                      onPress={() => handleSelectYear(year)}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          isSelectedYear ? styles.yearTextSelected : null,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {WEEK_DAYS.map(day => (
                    <Text key={day} style={styles.weekDay}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {dates.map((date, index) => {
                    if (!date) {
                      return (
                        <View key={`empty-${index}`} style={styles.dayCell} />
                      );
                    }

                    const dateValue = toDateValue(date);
                    const isSelected = dateValue === toDateValue(selectedDate);

                    return (
                      <TouchableOpacity
                        key={dateValue}
                        activeOpacity={0.75}
                        style={[
                          styles.dayCell,
                          isSelected && selectedValue
                            ? styles.dayCellSelected
                            : null,
                        ]}
                        onPress={() => handleSelect(date)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && selectedValue
                              ? styles.dayTextSelected
                              : null,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: scale(48),
    paddingHorizontal: 12,
  },
  triggerDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  triggerText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  placeholder: {
    color: '#9E9E9E',
  },
  disabledText: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  navButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  monthTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  monthTitleButton: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 100,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: colors.textLight,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
    paddingTop: 2,
  },
  yearCell: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: 10,
    marginHorizontal: '1.5%',
    width: '30.33%',
  },
  yearCellViewed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  yearCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  yearTextSelected: {
    color: colors.textLight,
  },
  cancelButton: {
    alignItems: 'center',
    paddingTop: 12,
  },
  cancelText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
