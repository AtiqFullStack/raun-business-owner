import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import theme from '../styles/theme';

export default function KeyboardWrapper({
  children,
  scroll = false,
  keyboardVerticalOffset = 0,
  dismissOnTap = true,
  scrollResetKey,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardVerticalOffset?: number;
  dismissOnTap?: boolean;
  scrollResetKey?: string | number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.container}
    >
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.inner}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={styles.inner}
          onTouchEnd={
            dismissOnTap
              ? event => {
                  if (event.target === event.currentTarget) Keyboard.dismiss();
                }
              : undefined
          }
        >
          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  inner: { flex: 1, backgroundColor: theme.colors.surface },
  scrollContent: { flexGrow: 1, backgroundColor: theme.colors.surface },
});
