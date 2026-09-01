import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CommonHeader from '../components/CommonHeader';
import Stepper from '../components/Stepper';
import Button from '../components/Button';
import { colors } from '../styles/theme';
import { ParcelSvg, OnDemand, BusinesIcon } from '../assets/svg';
import { navigate } from '../navigation/navigationRef';

const OPTIONS = [
    {
        key: 'business',
        title: 'Business',
        subTitle: 'For any kind of business',
        Icon: BusinesIcon,
    },
    {
        key: 'service',
        title: 'Service Provider',
        subTitle: 'On Demand Service.',
        Icon: OnDemand,
    },
];

export default function BusinessSelector() {
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <View style={styles.screen}>
            <CommonHeader
                useSafeAreaTop
                children={
                    <View style={{ paddingBottom: 25 }}>
                        <Text style={styles.heading}>Tell us about your Business</Text>
                        <Text style={styles.subHeading}>Select the option that best describes you</Text>
                        <Stepper length={2} currentStep={0} />
                    </View>
                }
            />

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {OPTIONS.map(({ key, title, subTitle, Icon }) => {
                    const isSelected = selected === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            activeOpacity={0.85}
                            onPress={() => setSelected(key)}
                            style={[styles.card, isSelected && styles.cardSelected]}>
                            <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                                <Icon width={19} height={19} />
                            </View>
                            <View style={styles.cardText}>
                                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                                    {title}
                                </Text>
                                <Text style={styles.cardSub}>{subTitle}</Text>
                            </View>
                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                {isSelected && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <Button
                    title="Continue"
                    onPress={() => { 
                        navigate('BusinessInfo')
                    }}
                    disabled={!selected}
                    fullWidth
                    style={styles.btn}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.screen,
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textLight,
        letterSpacing: 0.3,
    },
    subHeading: {
        fontSize: 13,
        color: colors.secondaryLight,
        marginTop: 4,
        marginBottom: 18,
    },
    body: {
        padding: 20,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 14,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 14,
    },
    cardSelected: {
        borderColor: colors.secondaryDark,
        backgroundColor: colors.primaryLight,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxSelected: {
        // backgroundColor: '#FFE4C8',
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    cardTitleSelected: {
        // color: colors.secondary,
    },
    cardSub: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 3,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.borderDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: colors.primary,
    },
    radioDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    btn: {
        marginTop: 150,
        backgroundColor: colors.primary,
        borderRadius: 12,

        paddingVertical: 14,
    },
});
