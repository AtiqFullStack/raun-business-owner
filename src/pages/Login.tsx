import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../styles/theme'
import Logo from '../assets/svg/Code/Logo'
import { EmailSvg, LockSvg, RstSvg } from '../assets/svg'
import { vh, vw } from '../utils/responsive'
import Button from '../components/Button'
import PartnerSvg from '../assets/svg/Code/PartnerSvg'
import { storage } from '../utils/storage'
import { navigate } from '../navigation/navigationRef'
import InputText from '../components/InputText'
import { Eye, EyeClosed, EyeOff } from 'lucide-react-native';
import KeyboardWrapper from '../components/KeyboardWrapper'


export default function Login() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  return (
    <KeyboardWrapper scroll>
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
        <Text style={[styles.text, { color: colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.text, {
          color: colors.textMuted, fontSize: 14, fontWeight: "400",
          lineHeight: 16,
          marginTop: 8

        }]}>Sign in to continue to your account </Text>


      </View>

      <View style={{
        marginTop: 40
      }}>
        <Loginform />
      </View>


      <Button
        title={"Login "}
        onPress={async () => {
          navigate("tellBusiness");
        }}
        // size={'lg'}
        style={{
          width: vw(85),
          backgroundColor: colors.primary,
           marginTop:20
        }}
      />
         </View>
    </KeyboardWrapper>
  )
}

const Loginform = (props: any) => {
  const [hidepassword, setHidePassword] = useState(true)

  return (
    <View style={{ width: vw(85) }}>
     <View>
       <InputText
        placeholder={"Enter Your Email"}
        label={"Enter your email"}
        leftIcon={<EmailSvg />}
        containerStyle={{ borderRadius: 4 }}
      />
      <InputText
        placeholder={"Mypassword1&"}
        label={"Password"}
        leftIcon={<LockSvg />}
        secureTextEntry={hidepassword}
        rightIcon={<>
          {hidepassword ? <Eye color={colors.textMuted} /> : <EyeOff color={colors.textMuted} />}
        </>}
        onRightIconPress={() => {
          setHidePassword((pre) => !pre)
        }}

      />
     </View>
     <TouchableOpacity>
      <Text style={{ alignSelf: "flex-end", marginVertical: 10, color: colors.secondary, fontSize:12 }}>Forgot Password?</Text>

     </TouchableOpacity>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screen,
    alignItems: 'center',
    paddingTop:130,
     paddingBottom:100
    // justifyContent: 'center',

  },
  text: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0.38,
    textAlign: "center"

  }
})