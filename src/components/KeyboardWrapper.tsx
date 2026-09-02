import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import theme from '../styles/theme';

export default function KeyboardWrapper({
  children,
  scroll = false,
  keyboardVerticalOffset=50
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

    const [keyboardStatus, setKeyboardStatus] = useState('Keyboard Hidden');
    const [offset,setOffset]=useState(0)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus('Keyboard Shown');
      setOffset(keyboardVerticalOffset)
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setOffset(0)
      setKeyboardStatus('Keyboard Hidden');
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
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
    backgroundColor: theme.colors.surface,
  },
  dismissArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  inner: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
  },
});
