import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../styles/theme';
import { scale } from '../utils/responsive';

const SCREEN_HEIGHT = Dimensions.get('window').height;

/* ─── Types ─────────────────────────────────────────────────────── */
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;

  /** Show search input inside the sheet/modal. Default: false */
  searchable?: boolean;

  /** Open as full-screen modal instead of bottom sheet. Default: false */
  fullScreen?: boolean;

  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  error?: string;
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function Select({
  label,
  placeholder = 'Select',
  options,
  value,
  onChange,
  searchable = false,
  fullScreen = false,
  containerStyle,
  labelStyle,
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || query.trim() === '') return options;
    const lower = query.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lower));
  }, [options, query, searchable]);

  const handleSelect = (item: SelectOption) => {
    onChange(item.value);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      {/* Trigger */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Sheet / Modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {fullScreen ? (
          /* ── Full Screen ── */
          <View style={styles.fullScreenContainer}>
            <ModalHeader title={label || placeholder} onClose={handleClose} />
            {searchable && <SearchBar query={query} onQueryChange={setQuery} />}
            <OptionList
              data={filteredOptions}
              selectedValue={value}
              onSelect={handleSelect}
            />
          </View>
        ) : (
          /* ── Bottom Sheet ── */
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            <View
              style={[styles.sheet, searchable ? styles.searchSheet : null]}
            >
              {/* Drag handle */}
              <View style={styles.handle} />

              <ModalHeader title={label || placeholder} onClose={handleClose} />
              {searchable && (
                <SearchBar query={query} onQueryChange={setQuery} />
              )}
              <OptionList
                data={filteredOptions}
                selectedValue={value}
                onSelect={handleSelect}
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={headerStyles.row}>
      <Text style={headerStyles.title} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={headerStyles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchBar({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (v: string) => void;
}) {
  return (
    <View style={searchStyles.wrapper}>
      <Text style={searchStyles.icon}>🔍</Text>
      <TextInput
        style={searchStyles.input}
        placeholder="Search..."
        placeholderTextColor={colors.placeholder}
        value={query}
        onChangeText={onQueryChange}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {query.length > 0 && (
        <TouchableOpacity
          onPress={() => onQueryChange('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={searchStyles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function OptionList({
  data,
  selectedValue,
  onSelect,
}: {
  data: SelectOption[];
  selectedValue?: string;
  onSelect: (item: SelectOption) => void;
}) {
  return (
    <ScrollView
      style={listStyles.wrapper}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={listStyles.content}
    >
      {data.length === 0 ? (
        <Text style={listStyles.emptyText}>No results found</Text>
      ) : (
        data.map(item => {
          const isSelected = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              android_ripple={{ color: colors.primaryLight }}
              style={({ pressed }) => [
                listStyles.option,
                isSelected && listStyles.optionSelected,
                pressed && listStyles.optionPressed,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text
                style={[
                  listStyles.optionText,
                  isSelected && listStyles.optionTextSelected,
                ]}
              >
                {item.label}
              </Text>
              {isSelected && <Text style={listStyles.checkmark}>✓</Text>}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  trigger: {
    height: scale(48),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  triggerPlaceholder: {
    color: colors.placeholder,
  },
  chevron: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },

  /* Overlay / backdrop */
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },

  /* Bottom sheet */
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: Math.min(SCREEN_HEIGHT * 0.36, 280),
    maxHeight: SCREEN_HEIGHT * 0.72,
    paddingBottom: Platform.OS === 'ios' ? 32 : 50,
    overflow: 'hidden',
    elevation: 8,
  },
  searchSheet: {
    minHeight: Math.min(SCREEN_HEIGHT * 0.52, 420),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  /* Full screen */
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.screen,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
  },
});

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  closeText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

const searchStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    height: scale(46),
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6,
  },
});

const listStyles = StyleSheet.create({
  wrapper: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  checkmark: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 30,
  },
});
