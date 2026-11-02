import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import useBookingChat from '../hooks/useBookingChat';
import type { BookingChatMessage } from '../services/bookingChatService';
import { colors } from '../styles/theme';
type Props = {
  route: {
    params: { orderId: string; title?: string; bookingNumber?: string };
  };
  navigation: { goBack: () => void };
};
export default function BookingChat({ route, navigation }: Props) {
  const { orderId, title, bookingNumber } = route.params;
  const chat = useBookingChat(orderId);
  const [draft, setDraft] = useState('');
  const draftRef = useRef('');
  const list = useRef<FlatList<BookingChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const send = () => {
    const text = draftRef.current.trim();
    if (!text || !chat.canSend || text.length > 1000) return;
    draftRef.current = '';
    setDraft('');
    chat.send(text);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <ArrowLeft color={colors.textLight} size={24} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>{title || 'Booking conversation'}</Text>
          <Text style={styles.subtitle}>
            {bookingNumber || 'Service booking'}
          </Text>
        </View>
      </View>
      {!!chat.error && (
        <View style={styles.errorCard}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {chat.error}
          </Text>
          <Pressable accessibilityRole="button" onPress={chat.refresh}>
            <Text style={styles.retry}>Refresh conversation</Text>
          </Pressable>
        </View>
      )}
      {chat.loading ? (
        <ActivityIndicator
          style={styles.loading}
          color={colors.primary}
          accessibilityLabel="Loading messages"
        />
      ) : !chat.messages.length ? (
        <View testID="booking-chat-empty" style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {!chat.ready
              ? 'Conversation unavailable'
              : chat.canSend
              ? 'Start a conversation'
              : 'No messages for this booking'}
          </Text>
          <Text style={styles.emptyText}>
            {!chat.ready
              ? 'Refresh the conversation to try again.'
              : chat.canSend
              ? 'Send a message about this booking.'
              : 'No messages were exchanged before this booking ended.'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={list}
          inverted
          data={chat.messages}
          keyExtractor={message => message._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 50,
          }}
          ListFooterComponent={
            chat.hasMore ? (
              <Pressable
                accessibilityRole="button"
                disabled={chat.loadingOlder}
                onPress={chat.loadOlder}
                style={styles.loadOlder}
              >
                {chat.loadingOlder ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.retry}>Load earlier messages</Text>
                )}
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => {
            const mine = item.senderId === chat.myId;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text
                  selectable
                  style={[styles.message, mine && styles.myMessage]}
                >
                  {item.message}
                </Text>
                <Text style={[styles.time, mine && styles.myTime]}>
                  {new Date(item.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {mine
                    ? ` · ${
                        {
                          sending: 'Sending…',
                          failed: 'Not sent',
                          sent: 'Sent',
                          delivered: 'Delivered',
                          read: 'Read',
                        }[item.status]
                      }`
                    : ''}
                </Text>
                {mine && item.status === 'failed' && chat.canSend && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry sending message"
                    onPress={() => chat.send(item.message, item)}
                  >
                    <Text style={styles.retryFailed}>Tap to retry</Text>
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      )}
      <View
        style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {chat.ready && !chat.canSend ? (
          <Text style={styles.closed}>
            {chat.messages.length
              ? 'This booking has ended. You can still read your conversation.'
              : 'Messaging is closed for this booking.'}
          </Text>
        ) : (
          <>
            <TextInput
              accessibilityLabel="Message"
              placeholder="Type a message…"
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={value => {
                draftRef.current = value;
                setDraft(value);
              }}
              multiline
              maxLength={1000}
              editable={chat.canSend}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !draft.trim() || !chat.canSend }}
              disabled={!draft.trim() || !chat.canSend}
              onPress={send}
              style={[
                styles.send,
                (!draft.trim() || !chat.canSend) && styles.disabled,
              ]}
            >
              <Send size={21} color={colors.textLight} />
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: colors.primary,
  },
  heading: { flex: 1, gap: 4 },
  title: { color: colors.textLight, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textLight, fontSize: 12 },
  loading: { flex: 1 },
  list: { flexGrow: 1, padding: 16, gap: 12 },
  bubble: { maxWidth: '85%', padding: 13, borderRadius: 16, gap: 7 },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  message: { color: colors.text, fontSize: 15, lineHeight: 22 },
  myMessage: { color: colors.textLight },
  time: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  myTime: { color: '#DDF3F0' },
  composer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    color: colors.text,
    fontSize: 15,
  },
  send: { backgroundColor: colors.primary, padding: 14, borderRadius: 25 },
  disabled: { opacity: 0.4 },
  errorCard: { backgroundColor: colors.errorSoft, padding: 14, gap: 8 },
  error: { color: colors.error, fontSize: 13, lineHeight: 20 },
  retry: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  retryFailed: { color: '#FFE2C5', fontWeight: '700', paddingVertical: 5 },
  loadOlder: { alignItems: 'center', padding: 16 },
  closed: { color: colors.textMuted, fontSize: 13, lineHeight: 20, flex: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
