import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { colors } from '../styles/theme';
import { vw } from '../utils/responsive';
import Button from '../components/Button';
import Logo from '../assets/svg/Code/Logo';
import { navigate } from '../navigation/navigationRef';
import { launchImageLibrary } from 'react-native-image-picker';

type DocItem = {
  id: string;
  label: string;
  hint: string;
  uri: string | null;
};

const INITIAL_DOCS: DocItem[] = [
  { id: 'fssai', label: 'FSSAI License', hint: 'Food Safety certificate', uri: null },
  { id: 'gst', label: 'GST Certificate', hint: 'Goods & Services Tax document', uri: null },
  { id: 'pan', label: 'PAN Card', hint: 'Business / Personal PAN', uri: null },
  { id: 'bank', label: 'Bank Passbook / Cheque', hint: 'For payment settlement', uri: null },
];

export default function Documents() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);

  const pickDocument = async (id: string) => {
    const result = await launchImageLibrary({ mediaType: 'mixed' });
    if (result.assets && result.assets[0]?.uri) {
      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, uri: result.assets![0].uri! } : d))
      );
    }
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, uri: null } : d)));
  };

  const allUploaded = docs.every((d) => d.uri !== null);

  const handleSubmit = () => {
    if (!allUploaded) {
      Alert.alert('Missing Documents', 'Please upload all required documents before submitting.');
      return;
    }
    navigate('ProfileUnderReview');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo />
      </View>

      {/* Step Indicator */}
      <StepIndicator current={5} total={6} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.stepTitle}>Documents</Text>
        <Text style={styles.stepSubtitle}>Upload Your Documents</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📋 All documents are required for verification. Files must be clear and legible (JPG, PNG, or PDF).
          </Text>
        </View>

        {docs.map((doc, index) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docLeft}>
              <View style={styles.docNumber}>
                <Text style={styles.docNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docHint}>{doc.hint}</Text>
              </View>
            </View>

            {doc.uri ? (
              <View style={styles.docPreview}>
                <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeDoc(doc.id)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickDocument(doc.id)}
              >
                <Text style={styles.uploadIcon}>⬆️</Text>
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Upload progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(docs.filter((d) => d.uri).length / docs.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {docs.filter((d) => d.uri).length}/{docs.length} documents uploaded
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Submit for Review"
          onPress={handleSubmit}
          style={allUploaded ? { ...styles.btn, ...styles.btnReady } : styles.btn}
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
  btn: { backgroundColor: colors.textMuted, width: '100%' },
  btnReady: { backgroundColor: colors.primary },
  stepTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },

  infoBox: {
    backgroundColor: colors.infoSoft,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  infoText: { fontSize: 13, color: colors.info, lineHeight: 20 },

  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  docNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNumberText: { color: colors.textLight, fontWeight: '700', fontSize: 14 },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  docHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  uploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    minWidth: 72,
  },
  uploadIcon: { fontSize: 16 },
  uploadText: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },

  docPreview: { position: 'relative' },
  docThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  progressContainer: { marginTop: 8, marginBottom: 8 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

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
