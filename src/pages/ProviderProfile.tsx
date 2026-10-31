import { formatMoney } from '../utils/currency';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import type { AccountStackParamList } from '../routes/TabNavigation';
import KeyboardWrapper from '../components/KeyboardWrapper';
import useOwnerProfile from '../hooks/useOwnerProfile';
import {
  availabilityLabels,
  experienceLabels,
} from '../services/ownerProfileService';
import { useAuth } from '../store/useAuth';
import { resetTo } from '../navigation/navigationRef';
import getImageUrl from '../utils/urlConvertor';

export default function ProviderProfile() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { profile, loading, error, refresh } = useOwnerProfile();
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const photo = getImageUrl(profile?.profilePhoto);
  const name = profile?.fullName || 'Service Provider';
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const approved = profile?.verificationStatus === 'APPROVED';
  const money = (amount: number | null) =>
    typeof amount === 'number' && Number.isFinite(amount)
      ? formatMoney(amount, profile?.currency)
      : 'Not set';
  const signOut = () =>
    Alert.alert(
      'Sign out?',
      'You can sign in again to manage your service bookings.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            useAuth.getState().logout();
            resetTo('login');
          },
        },
      ],
    );
  return (
    <KeyboardWrapper dismissOnTap={false}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go to home"
              style={styles.headerButton}
              onPress={() => navigation.getParent()?.navigate('Home')}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>My profile</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              style={styles.headerButton}
              onPress={() => navigation.getParent()?.navigate('Notification')}
            >
              <Bell size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          style={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && !!profile}
              onRefresh={refresh}
              tintColor="#164C48"
              colors={['#164C48']}
            />
          }
        >
          <View style={styles.body}>
            {!!error && (
              <View style={styles.errorBox}>
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={refresh}
                  style={styles.retry}
                >
                  <Text style={styles.link}>Retry</Text>
                </Pressable>
              </View>
            )}
            {loading && !profile ? (
              <>
              
              {/* <ActivityIndicator color="#164C48" style={styles.loading} /> */}
              </>
            ) : (
              profile && (
                <>
                  <View
                    style={[
                      styles.identity,
                      !!error && styles.identityAfterError,
                    ]}
                  >
                    <View style={styles.identityTop}>
                      <View style={styles.avatar}>
                        <Text style={styles.initials}>{initials}</Text>
                        {photo && failedPhoto !== photo && (
                          <Image
                            source={{ uri: photo }}
                            onError={() => setFailedPhoto(photo)}
                            style={styles.photo}
                          />
                        )}
                      </View>
                      <View
                        style={[
                          styles.verification,
                          !approved && styles.pendingVerification,
                        ]}
                      >
                        <ShieldCheck
                          size={13}
                          color={approved ? '#2E7354' : '#B66C32'}
                        />
                        <Text
                          style={[
                            styles.verificationText,
                            !approved && styles.pendingVerificationText,
                          ]}
                        >
                          {approved
                            ? 'Approved'
                            : profile.verificationStatus === 'REJECTED'
                            ? 'Needs attention'
                            : 'Under review'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.profession}>
                      {profile.professionalTitle ||
                        profile.serviceType?.name ||
                        'Service Provider'}
                    </Text>
                    <View style={styles.identityFooter}>
                      <View style={styles.accountType}>
                        <Wrench size={12} color="#6A8172" />
                        <Text style={styles.accountTypeLabel}>
                          Service Provider
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => navigation.navigate('EditProfile')}
                        style={styles.editButton}
                      >
                        <Pencil size={13} color="#164C48" />
                        <Text style={styles.editLabel}>Edit profile</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Section
                    title="About you"
                    icon={<BriefcaseBusiness size={17} color="#52765D" />}
                  >
                    <Text style={styles.bodyText}>
                      {profile.about ||
                        'Add a short introduction so customers can get to know your work.'}
                    </Text>
                    {!!profile.languages?.length && (
                      <View style={styles.languages}>
                        {profile.languages.map(language => (
                          <View key={language} style={styles.language}>
                            <Text style={styles.languageText}>{language}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Section>
                  <Section
                    title="Your service"
                    icon={<Wrench size={17} color="#52765D" />}
                  >
                    <Info
                      label="Service type"
                      value={
                        profile.serviceType?.name ||
                        profile.professionalTitle ||
                        'Not set'
                      }
                    />
                    <Info
                      label="Experience"
                      value={
                        experienceLabels[profile.totalExperienceRange || ''] ||
                        (typeof profile.totalExperience === 'number'
                          ? `${profile.totalExperience} year${
                              profile.totalExperience === 1 ? '' : 's'
                            }`
                          : 'Not provided')
                      }
                    />
                    <Info
                      label="Availability"
                      value={
                        availabilityLabels[
                          profile.availabilityPreference || ''
                        ] || 'Not set'
                      }
                    />
                  </Section>
                  {!!profile.availabilitySchedule?.length && (
                    <Section
                      title="Available hours"
                      icon={<Clock3 size={17} color="#52765D" />}
                    >
                      <Info
                        label="Time zone"
                        value={profile.availabilityTimezone || 'UTC'}
                      />
                      {profile.availabilitySchedule.map(day => (
                        <Info
                          key={day.day}
                          label={day.day[0] + day.day.slice(1).toLowerCase()}
                          value={
                            day.isClosed
                              ? 'Unavailable'
                              : `${day.openTime} – ${day.closeTime}`
                          }
                        />
                      ))}
                    </Section>
                  )}
                  <Section
                    title="Service rates"
                    icon={<Wallet size={17} color="#52765D" />}
                  >
                    <View style={styles.rateHero}>
                      <Text style={styles.rateAmount}>
                        {money(profile.hourlyRate)}
                      </Text>
                      <Text style={styles.rateUnit}>/ hour</Text>
                    </View>
                    <Info
                      label="Call-out charge"
                      value={money(profile.serviceCallCharge)}
                    />
                    <Info
                      label="Minimum charge"
                      value={money(profile.minimumCharge)}
                    />
                  </Section>
                  <Section
                    title="Working areas"
                    icon={<MapPin size={17} color="#52765D" />}
                  >
                    {profile.workingAreas?.length ? (
                      profile.workingAreas.map((area, index) => (
                        <View
                          key={`${area.city}-${area.area}-${index}`}
                          style={[styles.area, index > 0 && styles.divider]}
                        >
                          <View style={styles.areaIcon}>
                            <MapPin size={16} color="#6B8B74" />
                          </View>
                          <View style={styles.flex}>
                            <Text style={styles.itemTitle}>
                              {[area.area, area.city]
                                .filter(Boolean)
                                .join(', ')}
                            </Text>
                            <Text style={styles.itemDescription}>
                              {[area.address, area.pinCode]
                                .filter(Boolean)
                                .join(' · ') || 'Service coverage area'}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.bodyText}>
                        No working areas added.
                      </Text>
                    )}
                  </Section>
                  {!!profile.workExperiences?.length && (
                    <Section
                      title="Work experience"
                      icon={<BriefcaseBusiness size={17} color="#52765D" />}
                    >
                      {profile.workExperiences.map((item, index) => (
                        <View
                          key={`${item.companyName}-${index}`}
                          style={[
                            styles.timelineItem,
                            index > 0 && styles.divider,
                          ]}
                        >
                          <Text style={styles.itemTitle}>{item.jobTitle}</Text>
                          <Text style={styles.itemDescription}>
                            {item.companyName}
                          </Text>
                          <View style={styles.timelineDate}>
                            <Clock3 size={11} color="#8A998C" />
                            <Text style={styles.timelineText}>
                              {year(item.startDate)} –{' '}
                              {item.currentlyWorking
                                ? 'Present'
                                : year(item.endDate)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </Section>
                  )}
                  {!!profile.educationCertifications?.length && (
                    <Section
                      title="Education & certifications"
                      icon={<GraduationCap size={17} color="#52765D" />}
                    >
                      {profile.educationCertifications.map((item, index) => (
                        <View
                          key={`${item.title}-${index}`}
                          style={[
                            styles.timelineItem,
                            index > 0 && styles.divider,
                          ]}
                        >
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemDescription}>
                            {item.institution}
                          </Text>
                          {!!item.description && (
                            <Text style={styles.bodyText}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                      ))}
                    </Section>
                  )}
                  <Section
                    title="Account"
                    icon={<ShieldCheck size={17} color="#52765D" />}
                  >
                    <View style={styles.email}>
                      <Mail size={16} color="#7D9182" />
                      <View style={styles.flex}>
                        <Text style={styles.smallLabel}>Sign-in email</Text>
                        <Text style={styles.emailValue}>{profile.email}</Text>
                      </View>
                    </View>
                    <MenuRow
                      icon={<CalendarDays size={18} color="#52765D" />}
                      title="My bookings"
                      onPress={() =>
                        navigation.getParent()?.navigate('MyBookings', {
                          screen: 'Booking',
                          params: { status: 'all', period: undefined },
                        })
                      }
                    />
                    <MenuRow
                      icon={<Bell size={18} color="#52765D" />}
                      title="Notifications"
                      onPress={() =>
                        navigation.getParent()?.navigate('Notification')
                      }
                    />
                    {!!profile.rejectionReason && (
                      <Text style={styles.error}>
                        {profile.rejectionReason}
                      </Text>
                    )}
                  </Section>
                  <Pressable
                    accessibilityRole="button"
                    onPress={signOut}
                    style={styles.signOut}
                  >
                    <LogOut size={17} color="#B25C49" />
                    <Text style={styles.signOutLabel}>Sign out</Text>
                  </Pressable>
                </>
              )
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardWrapper>
  );
}
function year(date?: string | null) {
  return date && !Number.isNaN(Date.parse(date))
    ? String(new Date(date).getFullYear())
    : '—';
}
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}
function MenuRow({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.menuRow}
    >
      {icon}
      <Text style={styles.menuTitle}>{title}</Text>
      <ChevronRight size={16} color="#9BA99E" />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F6' },
  scroll: { flex: 1 },
  content: { paddingTop: 14, paddingBottom: 110 },
  hero: {
    backgroundColor: '#164C48',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  body: { paddingHorizontal: 18 },
  identity: {
    marginTop: 0,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EBE6',
    backgroundColor: '#FFFFFF',
  },
  identityAfterError: { marginTop: 14 },
  identityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#EAF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { position: 'absolute', width: 62, height: 62 },
  initials: { color: '#4A7261', fontSize: 22, fontWeight: '600' },
  verification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF4ED',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  verificationText: { color: '#2E7354', fontSize: 10, fontWeight: '600' },
  pendingVerification: { backgroundColor: '#FFF1E6' },
  pendingVerificationText: { color: '#B66C32' },
  name: { color: '#203F33', fontSize: 22, fontWeight: '700', marginTop: 16 },
  profession: { color: '#7B8A7E', fontSize: 13, marginTop: 5 },
  identityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#EDF1EE',
    paddingTop: 12,
  },
  accountType: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  accountTypeLabel: { color: '#6A8172', fontSize: 10 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    minHeight: 40,
    backgroundColor: '#F0F6F1',
    borderRadius: 8,
  },
  editLabel: { color: '#164C48', fontSize: 11, fontWeight: '600' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EBE6',
    marginTop: 14,
    padding: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: '#294E3B', fontSize: 14, fontWeight: '600', flex: 1 },
  bodyText: { color: '#7A897D', fontSize: 12, lineHeight: 20 },
  languages: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  language: {
    backgroundColor: '#F0F5F0',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  languageText: { fontSize: 11, color: '#608066' },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    paddingVertical: 8,
  },
  infoLabel: { color: '#8A988D', fontSize: 12, flex: 1 },
  infoValue: {
    color: '#3E5D46',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  rateHero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: '#F3F7F2',
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
  },
  rateAmount: { color: '#274E36', fontSize: 24, fontWeight: '700' },
  rateUnit: { color: '#8A998A', fontSize: 12 },
  area: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  areaIcon: {
    backgroundColor: '#F0F5F0',
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  itemTitle: {
    color: '#45624B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 19,
  },
  itemDescription: {
    color: '#8A988C',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  divider: {
    borderTopWidth: 1,
    borderColor: '#EEF2EE',
    marginTop: 8,
    paddingTop: 14,
  },
  timelineItem: { paddingBottom: 3 },
  timelineDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  timelineText: { color: '#8A998C', fontSize: 10 },
  email: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 14,
  },
  smallLabel: { color: '#8B998E', fontSize: 10, marginBottom: 4 },
  emailValue: { color: '#45624B', fontSize: 12 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    borderTopWidth: 1,
    borderColor: '#EEF2EE',
  },
  menuTitle: { flex: 1, color: '#45624B', fontSize: 12 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCD4',
    paddingVertical: 15,
    marginTop: 20,
  },
  signOutLabel: { color: '#B25C49', fontSize: 13, fontWeight: '600' },
  loading: { padding: 50 },
  errorBox: {
    backgroundColor: '#FFF1E8',
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  error: { color: '#B65B37', fontSize: 12, lineHeight: 18, flex: 1 },
  retry: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#C96C29', fontWeight: '600', fontSize: 12 },
});
