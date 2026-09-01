import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import VegIcon from '../assets/svg/Code/VegIcon'
import NonVegIcon from '../assets/svg/Code/NonVegIcon'

export default function VegNonVeg(props:{
    isVeg:Boolean
}) {
    const {isVeg} = props
  return (<>
  {isVeg ? <VegIcon /> : <NonVegIcon />}
  </>
  )
}

const styles = StyleSheet.create({})