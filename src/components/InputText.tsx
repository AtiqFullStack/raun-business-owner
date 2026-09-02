import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { scale } from '../utils/responsive';
import { colors } from '../styles/theme';

interface InputTextProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

export default function InputText({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onLeftIconPress,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  ...rest
}: InputTextProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={[styles.inputBox, focused && styles.focused, error ? styles.errorBorder : null]}>
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
            style={styles.iconLeft}>
            {leftIcon}
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#9E9E9E"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.iconRight}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
   
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    
     
  },
  focused: {
    borderColor: '#6C63FF',
    backgroundColor: '#fff',
  },
  errorBorder: {
    borderColor: '#E53935',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 12,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
  },
});
