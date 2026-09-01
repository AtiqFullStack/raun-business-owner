import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CommonHeader, { HeaderSearchInput } from '../components/CommonHeader';
import { colors } from '../styles/theme';
import { BackSvg } from '../assets/svg';
import useLocation from '../hooks/useLocation';
import { useLocationStore } from '../store/useLocationStore';
import { useToast } from '../store/useToast';
import {
  type AddressPayload,
  type AddressType,
  type UserAddress,
  useAddressService,
} from '../services/addressService';

type Props = {
  navigation: {
    goBack: () => void;
  };
};

type AddressForm = {
  label: string;
  addressType: AddressType;
  contactName: string;
  phoneNumber: string;
  houseFlatBlock: string;
  apartmentBuilding: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

const EMPTY_FORM: AddressForm = {
  label: 'Home',
  addressType: 'home',
  contactName: '',
  phoneNumber: '',
  houseFlatBlock: '',
  apartmentBuilding: '',
  street: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
};

const buildFormattedAddress = (form: AddressForm) =>
  [
    form.houseFlatBlock,
    form.apartmentBuilding,
    form.street,
    form.area,
    form.landmark,
    form.city,
    form.state,
    form.country,
    form.postalCode,
  ]
    .map(value => value.trim())
    .filter(Boolean)
    .join(', ');

const getFormFromAddress = (address: UserAddress): AddressForm => ({
  label: address.label || 'Home',
  addressType: address.addressType || 'home',
  contactName: address.contactName || '',
  phoneNumber: address.phoneNumber || '',
  houseFlatBlock: address.houseFlatBlock || '',
  apartmentBuilding: address.apartmentBuilding || '',
  street: address.street || '',
  area: address.area || '',
  landmark: address.landmark || '',
  city: address.city || '',
  state: address.state || '',
  country: address.country || '',
  postalCode: address.postalCode || '',
});

export default function SelectLocation({ navigation }: Props) {
  const { getPhysicalLocations, loading: locationLoading } = useLocation();
  const {
    createAddress,
    deleteAddress,
    getAddresses,
    loading: addressLoading,
    saveCurrentLocation,
    setDefaultAddress,
    updateAddress,
  } = useAddressService();
  const addresses = useLocationStore(state => state.addresses);
  const selectedAddress = useLocationStore(state => state.selectedAddress);
  const setAddresses = useLocationStore(state => state.setAddresses);
  const setSelectedAddress = useLocationStore(
    state => state.setSelectedAddress,
  );
  const setPhysicalLocation = useLocationStore(
    state => state.setPhysicalLocation,
  );
  const showToast = useToast(state => state.showToast);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [formVisible, setFormVisible] = useState(false);

  const selectedAddressId = selectedAddress?._id;

  const filteredAddresses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return addresses;
    }

    return addresses.filter(address =>
      [
        address.label,
        address.addressType,
        address.formattedAddress,
        address.city,
        address.area,
        address.street,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query)),
    );
  }, [addresses, search]);

  const refreshAddresses = async () => {
    const response = await getAddresses();
    setAddresses(response.data.addresses);
  };

  useEffect(() => {
    refreshAddresses().catch(() => {
      showToast('Unable to load addresses', 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddForm = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setFormVisible(true);
  };

  const openEditForm = (address: UserAddress) => {
    setEditingAddress(address);
    setForm(getFormFromAddress(address));
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingAddress(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (field: keyof AddressForm, value: string) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveAddress = async () => {
    const formattedAddress = buildFormattedAddress(form);

    if (!formattedAddress) {
      showToast('Please enter address details', 'error');
      return;
    }

    const payload: AddressPayload = {
      ...form,
      formattedAddress,
      isDefault: editingAddress?.isDefault ?? addresses.length === 0,
    };

    try {
      const response = editingAddress
        ? await updateAddress(editingAddress._id, payload)
        : await createAddress(payload);

      await refreshAddresses();
      setSelectedAddress(response.data.address);
      closeForm();
      showToast(
        editingAddress ? 'Address updated' : 'Address saved',
        'success',
      );
    } catch {
      showToast('Unable to save address', 'error');
    }
  };

  const handleCurrentLocation = async () => {
    try {
      const readableLocation = await getPhysicalLocations();
      const coords = useLocationStore.getState().coords;

      if (!readableLocation || !coords) {
        showToast('Unable to fetch current location', 'error');
        return;
      }

      const response = await saveCurrentLocation({
        formattedAddress: readableLocation,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isDefault: true,
      });

      await refreshAddresses();
      setSelectedAddress(response.data.address);
      showToast('Current location saved', 'success');
    } catch {
      showToast('Unable to save current location', 'error');
    }
  };

  const handleSelectAddress = async (address: UserAddress) => {
    try {
      const response = await setDefaultAddress(address._id);
      await refreshAddresses();
      setSelectedAddress(response.data.address);
      setPhysicalLocation(response.data.address.formattedAddress);
      navigation.goBack();
    } catch {
      showToast('Unable to select address', 'error');
    }
  };

  const handleDeleteAddress = (address: UserAddress) => {
    Alert.alert('Delete address?', 'This address will be removed.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(address._id);
            await refreshAddresses();
            showToast('Address deleted', 'success');
          } catch {
            showToast('Unable to delete address', 'error');
          }
        },
      },
    ]);
  };

  const busy = locationLoading || addressLoading;

  return (
    <View style={styles.screen}>
      <CommonHeader
        left={
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackSvg />
          </Pressable>
        }
        title="Select a Location"
        bottomPadding={19}
        childrenContainerStyle={styles.searchContainer}
        containerStyle={styles.header}
        horizontalPadding={16}
        rowStyle={styles.headerRow}
        titleStyle={styles.headerTitle}
        topPadding={18}
      >
        <HeaderSearchInput
          placeholder="Search Location"
          placeholderTextColor="rgba(255,255,255,0.52)"
          containerStyle={styles.searchBox}
          onChangeText={setSearch}
          style={styles.searchInput}
          value={search}
        />
      </CommonHeader>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionsCard}>
          <LocationAction
            disabled={busy}
            icon={
              locationLoading ? (
                <ActivityIndicator color={colors.secondary} size="small" />
              ) : (
                <TargetIcon />
              )
            }
            label={
              locationLoading
                ? 'Fetching Current Location'
                : 'Use Current Location'
            }
            onPress={handleCurrentLocation}
          />
          <View style={styles.actionDivider} />
          <LocationAction
            disabled={busy}
            icon={<PlusIcon />}
            label="Add Address"
            onPress={openAddForm}
          />
        </View>

        {addressLoading && addresses.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {!addressLoading && filteredAddresses.length === 0 ? (
          <Text style={styles.emptyText}>No address found</Text>
        ) : null}

        {filteredAddresses.map(address => {
          const selected =
            address._id === selectedAddressId || address.isDefault;

          return (
            <Pressable
              accessibilityRole="button"
              key={address._id}
              onPress={() => handleSelectAddress(address)}
              style={({ pressed }) => [
                styles.addressCard,
                selected && styles.addressCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.addressCopy}>
                <Text style={styles.deliverLabel}>Deliver To</Text>
                <View style={styles.addressTitleRow}>
                  <HomeIcon />
                  <Text style={styles.addressTitle}>{address.label}</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address.formattedAddress}
                </Text>
              </View>

              <View style={styles.addressActions}>
                <IconCircle
                  onPress={() => openEditForm(address)}
                  variant="edit"
                >
                  <EditIcon />
                </IconCircle>
                <IconCircle
                  onPress={() => handleDeleteAddress(address)}
                  variant="delete"
                >
                  <DeleteIcon />
                </IconCircle>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <AddressFormModal
        busy={addressLoading}
        form={form}
        onChange={updateForm}
        onClose={closeForm}
        onSave={handleSaveAddress}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
        visible={formVisible}
      />
    </View>
  );
}

function AddressFormModal({
  busy,
  form,
  onChange,
  onClose,
  onSave,
  title,
  visible,
}: {
  busy: boolean;
  form: AddressForm;
  onChange: (field: keyof AddressForm, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeButtonText}>x</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.typeRow}>
              {(['home', 'work', 'other'] as AddressType[]).map(type => {
                const active = form.addressType === type;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={type}
                    onPress={() => {
                      onChange('addressType', type);
                      onChange(
                        'label',
                        type.charAt(0).toUpperCase() + type.slice(1),
                      );
                    }}
                    style={({ pressed }) => [
                      styles.typePill,
                      active && styles.typePillActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        active && styles.typePillTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <FormInput
              label="Label"
              onChangeText={value => onChange('label', value)}
              value={form.label}
            />
            <FormInput
              label="Contact Name"
              onChangeText={value => onChange('contactName', value)}
              value={form.contactName}
            />
            <FormInput
              keyboardType="phone-pad"
              label="Phone Number"
              onChangeText={value => onChange('phoneNumber', value)}
              value={form.phoneNumber}
            />
            <FormInput
              label="House / Flat / Block"
              onChangeText={value => onChange('houseFlatBlock', value)}
              value={form.houseFlatBlock}
            />
            <FormInput
              label="Apartment / Building"
              onChangeText={value => onChange('apartmentBuilding', value)}
              value={form.apartmentBuilding}
            />
            <FormInput
              label="Street"
              onChangeText={value => onChange('street', value)}
              value={form.street}
            />
            <FormInput
              label="Area"
              onChangeText={value => onChange('area', value)}
              value={form.area}
            />
            <FormInput
              label="Landmark"
              onChangeText={value => onChange('landmark', value)}
              value={form.landmark}
            />
            <FormInput
              label="City"
              onChangeText={value => onChange('city', value)}
              value={form.city}
            />
            <FormInput
              label="State"
              onChangeText={value => onChange('state', value)}
              value={form.state}
            />
            <FormInput
              label="Country"
              onChangeText={value => onChange('country', value)}
              value={form.country}
            />
            <FormInput
              label="Postal Code"
              onChangeText={value => onChange('postalCode', value)}
              value={form.postalCode}
            />
          </ScrollView>

          <View style={styles.formActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onSave}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.textLight} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormInput({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.formInput}
        {...props}
      />
    </View>
  );
}

function LocationAction({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function IconCircle({
  children,
  onPress,
  variant,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant: 'edit' | 'delete';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      onPress={event => {
        event.stopPropagation();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconCircle,
        variant === 'delete' && styles.deleteCircle,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function TargetIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={7}
        stroke={colors.secondary}
        strokeWidth={1.8}
      />
      <Circle cx={12} cy={12} r={2.4} fill={colors.secondary} />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function HomeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="m4 11 8-7 8 7v9H6v-7h12"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="m4 16.8-.7 3.9 3.9-.7L18.8 8.4l-3.2-3.2L4 16.8Z"
        fill={colors.secondary}
      />
      <Path
        d="m14.7 6.1 3.2 3.2"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function DeleteIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 9v9M16 9v9M5 6h14M10 6V4h4v2M7 6l1 15h8l1-15"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerRow: {
    justifyContent: 'flex-start',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: '800',
  },
  searchContainer: {
    marginTop: 18,
  },
  searchBox: {
    backgroundColor: colors.transparent,
    borderColor: colors.serachnputBorder,
    borderRadius: 5,
    height: 42,
  },
  searchInput: {
    color: colors.textLight,
    fontSize: 12,
  },
  content: {
    paddingBottom: 116,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 18,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  actionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 16,
  },
  actionDivider: {
    backgroundColor: colors.divider,
    height: 1,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  addressCardSelected: {
    borderColor: '#2682FF',
    borderWidth: 3,
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
  },
  deliverLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  addressTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 7,
  },
  addressTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },
  addressText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 13,
    marginLeft: 21,
    marginTop: 4,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  deleteCircle: {
    backgroundColor: colors.primarySoft,
  },
  disabled: {
    opacity: 0.55,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 20,
    textAlign: 'center',
  },
  formActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  formContent: {
    paddingBottom: 6,
    paddingHorizontal: 16,
  },
  formInput: {
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  loader: {
    paddingVertical: 18,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.34)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '88%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeButtonText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 5,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  typePill: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  typePillActive: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },
  typePillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  typePillTextActive: {
    color: colors.secondary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
  },
});
