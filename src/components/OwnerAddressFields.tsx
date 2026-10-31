import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from './InputText';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  MapPin,
  Search,
  X,
} from 'lucide-react-native';
import { colors } from '../styles/theme';
import {
  useOwnerPlacesService,
  type PlaceSuggestion,
} from '../services/ownerPlacesService';
import type { MapCoordinates } from './Map';
type Field = 'address' | 'area' | 'city' | 'pinCode';
type Props = {
  value: Record<Field, string> & { coordinates?: MapCoordinates | null };
  errors?: Partial<Record<Field | 'coordinates', string>>;
  onChange: (field: Field, value: string) => void;
  onCoordinatesChange: (coordinates: MapCoordinates | null) => void;
};
export default function OwnerAddressFields({
  value,
  errors = {},
  onChange,
  onCoordinatesChange,
}: Props) {
  const { search, details } = useOwnerPlacesService();
  const [kind, setKind] = useState<'address' | 'city' | 'area' | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [retry, setRetry] = useState(0);
  const session = useRef('');
  const version = useRef(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const close = () => {
    Keyboard.dismiss();
    setKeyboardVisible(false);
    version.current++;
    setKind(null);
    setSelecting(null);
    setBusy(false);
  };
  useEffect(() => {
    if (!kind || query.trim().length < 2) {
      setSuggestions([]);
      setBusy(false);
      return;
    }
    const request = ++version.current;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const rows = await search(query.trim(), session.current, kind);
        if (!cancelled && request === version.current) {
          setSuggestions(rows);
          setHasSearched(true);
        }
      } catch (err) {
        if (!cancelled && request === version.current)
          setError(
            err instanceof Error
              ? err.message
              : 'Search failed. Please try again.',
          );
      } finally {
        if (!cancelled && request === version.current) setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [query, kind, search, retry]);
  const select = async (row: PlaceSuggestion) => {
    const request = ++version.current;
    setSelecting(row.placeId);
    setBusy(true);
    setError('');
    try {
      const place = await details(row.placeId, session.current);
      if (request !== version.current) return;
      if (kind === 'city') {
        onChange('city', place.city || row.label.split(',')[0]);
        onChange('address', '');
        onChange('area', '');
        onChange('pinCode', '');
        onCoordinatesChange(null);
      } else {
        onChange('address', place.address);
        onChange('area', place.area);
        onChange('city', place.city);
        onChange('pinCode', place.pinCode);
        onCoordinatesChange(place.coordinates);
      }
      close();
    } catch (err) {
      if (request === version.current)
        setError(
          err instanceof Error ? err.message : 'Unable to select location.',
        );
    } finally {
      if (request === version.current) {
        setBusy(false);
        setSelecting(null);
      }
    }
  };
  return (
    <View>
      {(['address', 'city', 'area'] as const).map(field => (
        <View key={field} style={styles.field}>
          <Text style={styles.label}>
            {field === 'address'
              ? 'Address'
              : field === 'city'
              ? 'City / Town'
              : 'Area / Locality'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Select ${field}`}
            style={styles.trigger}
            onPress={() => {
              session.current = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                c => {
                  const n = Math.floor(Math.random() * 16);
                  return (c === 'x' ? n : (n & 3) | 8).toString(16);
                },
              );
              setQuery(field === 'area' ? value.city : '');
              setSuggestions([]);
              setError('');
              setHasSearched(false);
              setBusy(field === 'area' && value.city.trim().length >= 2);
              setKind(field);
            }}
          >
            <Text
              style={{
                color: value[field] ? colors.text : colors.placeholder,
                flex: 1,
              }}
            >
              {value[field] || `Search ${field} with Google`}
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
          {!!errors[field] && <Text style={styles.error}>{errors[field]}</Text>}
        </View>
      ))}
      <InputText
        label="Postal / ZIP code (if applicable)"
        value={value.pinCode}
        placeholder="Postal code"
        autoCapitalize="characters"
        onChangeText={text => onChange('pinCode', text)}
        error={errors.pinCode}
      />
      <Text style={styles.hint}>
        {value.coordinates
          ? 'Location added. Customers nearby can find your services.'
          : 'Choose an address or area from the search results to set your location.'}
      </Text>
      {!!errors.coordinates && (
        <Text style={styles.error}>{errors.coordinates}</Text>
      )}
      <Modal
        visible={kind !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            accessibilityLabel="Close address search"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <View
              style={[styles.handle, keyboardVisible && styles.compactHandle]}
            />
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MapPin size={24} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>YOUR BUSINESS LOCATION</Text>
                <Text style={styles.title}>
                  {kind === 'city'
                    ? 'Choose your city'
                    : kind === 'area'
                    ? 'Find your area'
                    : 'Find your address'}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close search"
                style={styles.closeButton}
                onPress={close}
              >
                <X size={19} color={colors.text} />
              </TouchableOpacity>
            </View>
            {!keyboardVisible && (
              <Text style={styles.subtitle}>
                Search a street, neighbourhood or landmark and choose the right
                match.
              </Text>
            )}
            <View style={styles.searchBox}>
              <InputText
                label="Search in any country"
                labelStyle={
                  keyboardVisible ? styles.hiddenLabel : styles.searchLabel
                }
                placeholder={
                  kind === 'city'
                    ? 'e.g. Bandar Seri Begawan'
                    : 'e.g. Kiulap, Brunei'
                }
                autoFocus
                autoCorrect={false}
                value={query}
                editable={!selecting}
                leftIcon={<Search size={20} color={colors.primary} />}
                rightIcon={
                  query ? <X size={17} color={colors.textMuted} /> : undefined
                }
                onRightIconPress={() => {
                  version.current++;
                  setSelecting(null);
                  setQuery('');
                  setSuggestions([]);
                  setHasSearched(false);
                  setBusy(false);
                  setError('');
                }}
                containerStyle={styles.searchInput}
                boxStyle={styles.searchInputBox}
                onChangeText={text => {
                  version.current++;
                  setBusy(text.trim().length >= 2);
                  setQuery(text);
                  setError('');
                  setHasSearched(false);
                  setSuggestions([]);
                }}
              />
            </View>
            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>
                {suggestions.length ? 'SUGGESTED LOCATIONS' : 'ADDRESS SEARCH'}
              </Text>
              {busy && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            <ScrollView
              style={styles.results}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {error ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <MapPin size={28} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Couldn’t load locations</Text>
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.emptyBody}
                  >
                    {error}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.retryButton}
                    onPress={() => {
                      setBusy(true);
                      setRetry(previous => previous + 1);
                    }}
                  >
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : suggestions.length ? (
                suggestions.map(row => {
                  const [primary, ...secondary] = row.label.split(',');
                  return (
                    <TouchableOpacity
                      key={row.placeId}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${row.label}`}
                      disabled={busy}
                      style={styles.result}
                      onPress={() => select(row)}
                    >
                      <View style={styles.resultIcon}>
                        <MapPin size={20} color={colors.primary} />
                      </View>
                      <View style={styles.resultText}>
                        <Text style={styles.resultTitle}>{primary.trim()}</Text>
                        {!!secondary.length && (
                          <Text style={styles.resultSubtitle}>
                            {secondary.join(',').trim()}
                          </Text>
                        )}
                      </View>
                      {selecting === row.placeId ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <ArrowUpRight size={18} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Search size={30} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {busy
                      ? 'Finding your location…'
                      : hasSearched
                      ? 'No matching locations'
                      : 'Where do you work?'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {busy
                      ? 'Looking for the best matches for your search.'
                      : hasSearched
                      ? 'Try a nearby landmark, or add the city and country to your search.'
                      : 'Start typing to find an address, city or area. Locations from any country are welcome.'}
                  </Text>
                  {!query && !!value.address && (
                    <View style={styles.currentLocation}>
                      <Check size={16} color={colors.primary} />
                      <Text style={styles.currentText}>
                        Current: {value.address}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            <View style={styles.footer}>
              {!keyboardVisible && (
                <View style={styles.footerNote}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.footerText}>
                    Pick a result to confirm your location
                  </Text>
                </View>
              )}
              <Image
                accessibilityLabel="Powered by Google"
                source={{
                  uri: 'https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png',
                }}
                style={styles.googleLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { color: colors.text, fontSize: 14 },
  trigger: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
  },
  error: { color: colors.error, fontSize: 12, marginTop: 5, marginBottom: 10 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    height: '88%',
    backgroundColor: colors.screen,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    overflow: 'hidden',
  },
  compactHandle: { marginBottom: 12 },
  hiddenLabel: { display: 'none' },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 22,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBox: {
    marginHorizontal: 22,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
  searchInput: { marginBottom: 0 },
  searchInputBox: {
    borderRadius: 12,
    borderColor: colors.border,
    minHeight: 52,
  },
  searchLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 8,
  },
  resultsHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
    height: 20,
  },
  resultsTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  results: { flex: 1 },
  resultsContent: { paddingHorizontal: 22, paddingBottom: 18, flexGrow: 1 },
  result: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { flex: 1 },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  resultSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  currentLocation: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
  },
  currentText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingTop: 14,
    marginHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 14,
  },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, color: colors.textMuted },
  googleLogo: { width: 120, height: 15, alignSelf: 'flex-end' },
  retryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: { color: colors.textLight, fontSize: 13, fontWeight: '600' },
});
