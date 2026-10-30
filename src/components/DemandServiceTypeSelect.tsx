import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Select from './Select';
import {
  useBusinessOwnerService,
  type DemandServiceType,
} from '../services/businessOwnerService';
import { colors } from '../styles/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function DemandServiceTypeSelect({
  value,
  onChange,
  error,
}: Props) {
  const { getDemandServiceTypes } = useBusinessOwnerService();
  const [items, setItems] = useState<DemandServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getDemandServiceTypes()
      .then(result => {
        if (active) setItems(result);
      })
      .catch(err => {
        if (active)
          setLoadError(err?.message || 'Unable to load service types.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getDemandServiceTypes, attempt]);
  const selected = items.find(item => item._id === value);
  return (
    <View style={styles.container}>
      <Select
        label="Service type"
        placeholder={
          loading ? 'Loading service types…' : 'Select your service type'
        }
        searchable
        disabled={loading || !!loadError || !items.length}
        options={items.map(item => ({
          label: item.name,
          value: item._id,
          description: item.description,
          icon: item.icon,
        }))}
        value={value}
        onChange={onChange}
        error={
          error ||
          (value && !loading && !loadError && !selected
            ? 'This service type is no longer available. Please select another.'
            : undefined)
        }
        containerStyle={styles.select}
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {!!loadError && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {loadError}
            </Text>
          )}
          {!loadError && !items.length && (
            <Text style={styles.hint}>
              No service types are available yet. Please try again later.
            </Text>
          )}
          {!!selected?.description && !loadError && (
            <Text style={styles.hint}>{selected.description}</Text>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh service types"
            onPress={() => setAttempt(count => count + 1)}
            style={styles.refresh}
          >
            <Text style={styles.refreshText}>
              {loadError ? 'Retry' : 'Refresh list'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  select: { marginBottom: 0 },
  loader: { marginTop: 10, alignSelf: 'flex-start' },
  hint: { marginTop: 8, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  error: { marginTop: 8, fontSize: 12, color: colors.error },
  refresh: { alignSelf: 'flex-end', paddingVertical: 8 },
  refreshText: { fontSize: 12, fontWeight: '600', color: colors.primary },
});
