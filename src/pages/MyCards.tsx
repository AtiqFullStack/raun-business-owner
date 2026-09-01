import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import CommonHeader from '../components/CommonHeader';
import type { AccountStackParamList } from '../routes/TabNavigation';
import {
  getCardExpiry,
  useCardService,
  type UserCard,
} from '../services/cardService';
import { useToast } from '../store/useToast';
import { colors } from '../styles/theme';
import { BackSvg } from '../assets/svg';

type Props = NativeStackScreenProps<AccountStackParamList, 'MyCards'>;

type CardForm = {
  cardNumber: string;
  expiry: string;
  cvv: string;
};

const getDigits = (value: string) => value.replace(/\D/g, '');

const formatCardNumber = (value: string) =>
  getDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value: string) => {
  const digits = getDigits(value).slice(0, 4);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length === 1) {
    return Number(digits) > 1 ? `0${digits}/` : digits;
  }

  const rawMonth = Number(digits.slice(0, 2));
  const month = Math.min(Math.max(rawMonth, 1), 12).toString().padStart(2, '0');
  const year = digits.slice(2);

  return year ? `${month}/${year}` : `${month}/`;
};

const isValidExpiry = (expiry: string) => {
  const [monthText, yearText] = expiry.split('/');

  if (monthText?.length !== 2 || yearText?.length !== 2) {
    return false;
  }

  const month = Number(monthText);

  return month >= 1 && month <= 12;
};

export default function MyCards({ navigation }: Props) {
  const showToast = useToast(state => state.showToast);
  const { createCard, deleteCard, getCards, loading, setDefaultCard } =
    useCardService();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [form, setForm] = useState<CardForm>({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const updateField = (field: keyof CardForm, value: string) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      cardNumber: '',
      expiry: '',
      cvv: '',
    });
  };

  const loadCards = useCallback(async () => {
    try {
      const response = await getCards();
      setCards(response.data.cards);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to fetch cards.';

      showToast(message, 'error');
    }
  }, [getCards, showToast]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleCardNumberChange = (value: string) => {
    updateField('cardNumber', getDigits(value).slice(0, 16));
  };

  const handleExpiryChange = (value: string) => {
    updateField('expiry', formatExpiry(value));
  };

  const handleCvvChange = (value: string) => {
    updateField('cvv', getDigits(value).slice(0, 4));
  };

  const handleSave = async () => {
    if (form.cardNumber.length !== 16) {
      showToast('Card number must be 16 digits.', 'error');
      return;
    }

    if (!isValidExpiry(form.expiry)) {
      showToast('Enter a valid expiry date.', 'error');
      return;
    }

    if (form.cvv.length < 3) {
      showToast('CVV must be 3 or 4 digits.', 'error');
      return;
    }

    try {
      const response = await createCard({
        cardNumber: form.cardNumber,
        expiry: form.expiry,
        cvv: form.cvv,
      });

      setCards(current => [response.data.card, ...current]);
      resetForm();
      showToast(response.message || 'Card details saved.', 'success');
      await loadCards();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to save card.';

      showToast(message, 'error');
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      const response = await setDefaultCard(cardId);
      setCards(current =>
        current.map(card => ({
          ...card,
          isDefault: card._id === response.data.card._id,
        })),
      );
      showToast(response.message || 'Default card updated.', 'success');
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to update default card.';

      showToast(message, 'error');
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      const response = await deleteCard(cardId);
      showToast(response.message || 'Card deleted.', 'success');
      await loadCards();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to delete card.';

      showToast(message, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
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
        title="Add Card"
        bottomPadding={20}
        containerStyle={styles.header}
        horizontalPadding={15}
        rowStyle={styles.headerRow}
        titleStyle={styles.headerTitle}
        topPadding={30}
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardPanel}>
          <CardInput
            keyboardType="number-pad"
            label="Card Number"
            maxLength={19}
            onChangeText={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(form.cardNumber)}
          />

          <View style={styles.row}>
            <CardInput
              containerStyle={styles.rowField}
              keyboardType="number-pad"
              label="Expires"
              maxLength={5}
              onChangeText={handleExpiryChange}
              placeholder="MM/YY"
              value={form.expiry}
            />
            <CardInput
              containerStyle={styles.rowField}
              keyboardType="number-pad"
              label="CVV"
              maxLength={4}
              onChangeText={handleCvvChange}
              placeholder="123"
              secureTextEntry
              value={form.cvv}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={resetForm}
          style={({ pressed }) => [
            styles.addCardButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addCardText}>+ Add New Card</Text>
        </Pressable>

        {cards.length > 0 ? (
          <View style={styles.savedCards}>
            <Text style={styles.savedTitle}>Saved Cards</Text>
            {cards.map(card => (
              <SavedCard
                card={card}
                key={card._id}
                onDelete={() => handleDelete(card._id)}
                onSetDefault={() => handleSetDefault(card._id)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
      >
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function SavedCard({
  card,
  onDelete,
  onSetDefault,
}: {
  card: UserCard;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <View style={styles.savedCard}>
      <View style={styles.savedCardTop}>
        <Text style={styles.savedCardNumber}>{card.cardNumberMasked}</Text>
        {card.isDefault ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.savedCardExpiry}>Expires {getCardExpiry(card)}</Text>
      <View style={styles.savedCardActions}>
        {!card.isDefault ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSetDefault}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Set Default</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CardInput({
  containerStyle,
  label,
  ...props
}: {
  containerStyle?: object;
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={containerStyle}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.52)"
        selectionColor={colors.primary}
        style={styles.input}
        {...props}
      />
    </View>
  );
}



const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 180,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  cardPanel: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
    elevation: 3,
    minHeight: 163,
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  inputLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 7,
  },
  input: {
    borderColor: 'rgba(255,255,255,0.26)',
    borderRadius: 5,
    borderWidth: 1,
    color: colors.textLight,
    fontSize: 10,
    height: 40,
    paddingHorizontal: 13,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  rowField: {
    flex: 1,
  },
  addCardButton: {
    alignItems: 'center',
    borderColor: colors.secondary,
    borderRadius: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginTop: 20,
  },
  addCardText: {
    color: colors.secondaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  savedCards: {
    marginTop: 22,
  },
  savedTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  savedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  savedCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedCardNumber: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  savedCardExpiry: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
  defaultBadge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultBadgeText: {
    color: colors.secondaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  savedCardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  deleteText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 5,
    bottom: 106,
    height: 49,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    right: 18,
  },
  saveText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.62,
  },
});
