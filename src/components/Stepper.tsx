import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../styles/theme';

export default function Stepper(props: any) {
    const { length = 2, currentStep } = props
    const arr = Array.from({ length }, (_, index) => index);
    console.log(arr)
    return (
        <View style={{
            flexDirection: "row",
            gap: "5%"
        }}>
            {arr.map((item, index) => {
                const selected = currentStep == item
                console.log(currentStep)
                console.log(selected)
                return <View key={item} style={[styles.item, {
                    width: `${(100 / length) - length}%`,
                    backgroundColor: selected ? colors.secondary : colors.textMuted
                   
                }]}>

                </View>
            })}

        </View>
    )
}

const styles = StyleSheet.create({
    item: {
        backgroundColor:colors.textMuted,
        height: 6,

        borderRadius: 50

    }
})