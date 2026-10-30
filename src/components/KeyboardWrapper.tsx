import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import theme from '../styles/theme';

export default function KeyboardWrapper({
  children,
  scroll = false,
  keyboardVerticalOffset = 50,
  dismissOnTap = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardVerticalOffset?: number;
  // Screens with their own scroll container handle keyboard dismissal on drag.
  dismissOnTap?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setOffset(keyboardVerticalOffset),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setOffset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [keyboardVerticalOffset]);

  const content = scroll ? (
    <ScrollView
      style={styles.inner}
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.inner}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
      style={styles.container}
    >
      {dismissOnTap ? (
        <Pressable
          accessible={false}
          style={styles.inner}
          onPress={Keyboard.dismiss}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  inner: { flex: 1, backgroundColor: theme.colors.surface },
  scrollContent: { flexGrow: 1, backgroundColor: theme.colors.surface },
});
