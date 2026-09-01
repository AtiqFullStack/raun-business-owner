import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import React from 'react';
import theme from '../styles/theme';

export default function KeyboardWrapper({
  children,
  scroll = false,
  keyboardVerticalOffset=0
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardVerticalOffset?:number

}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
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
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.container}
    >
      <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss}>
        {content}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
  dismissArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
  inner: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
});
