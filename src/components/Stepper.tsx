import { StyleSheet, View } from 'react-native';
import React from 'react';
import { colors } from '../styles/theme';

export default function Stepper(props: {
  length?: number;
  currentStep: number;
}) {
  const { length = 2, currentStep } = props;
  const arr = Array.from({ length }, (_, index) => index);
  return (
    <View style={styles.row}>
      {arr.map(item => {
        const selected = currentStep === item;
        return (
          <View
            key={item}
            style={[
              styles.item,
              {
                width: `${100 / length - length}%`,
                backgroundColor: selected ? colors.secondary : colors.textMuted,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: '5%' },
  item: {
    backgroundColor: colors.textMuted,
    height: 6,

    borderRadius: 50,
  },
});
