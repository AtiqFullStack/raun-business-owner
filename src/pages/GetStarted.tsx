import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../styles/theme'
import Logo from '../assets/svg/Code/Logo'
import { RstSvg } from '../assets/svg'
import { vh, vw } from '../utils/responsive'
import Button from '../components/Button'
import PartnerSvg from '../assets/svg/Code/PartnerSvg'
import { storage } from '../utils/storage'
import { navigate } from '../navigation/navigationRef'


export default function GetStarted() {
    return (
        <View style={styles.container}>
            <View>
                <Logo />
            </View>

            <View style={{ marginVertical: 25 }}>
                <PartnerSvg />
            </View>
            <View style={{
                // marginTop: vh(10),
                width: 328,
                alignSelf: "center",
                // backgroundColor: "red"
            }}>
                <Text style={[styles.text, { color: colors.text }]}>Welcome to Raun Partner!</Text>
                <Text style={[styles.text, {
                    color: colors.textMuted, fontSize: 14, fontWeight: "400",
                    lineHeight: 16, marginTop: 8

                }]}>Manage Your restaurant, track Orders,  and </Text>
                <Text style={[styles.text, {
                    color: colors.textMuted, fontSize: 14, fontWeight: "400",
                    lineHeight: 16

                }]}>grow your business - all in one Place </Text>

            </View>

            <View style={{
                marginTop: 40
            }}>
                <RstSvg />
            </View>
            <Button
                title={"Get Started "}
                onPress={async () => {
                    await storage.setItem("showGetStarted", "false");
                    navigate('login')
                }}
                // size={'lg'}
                style={{
                    width: vw(85),
                    backgroundColor: colors.primary
                }}
            />
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.screen,
        alignItems: 'center',
        justifyContent: 'center',

    },
    text: {
        fontSize: 25,
        fontWeight: '700',
        lineHeight: 36,
        letterSpacing: 0.38,
        textAlign: "center"

    }
})