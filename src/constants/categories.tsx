import React from "react";
import Svg, { Circle } from "react-native-svg";
import {
  AllSvg,
  BurgerSvg,
  PizzaSvg,
  SandWitchSvg,
} from "../assets/svg";
import type { CategoryListItem } from "../components/CategoryList";
import { colors } from "../styles/theme";

const MoreIcon = () => {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={7} cy={12} r={1.7} fill={colors.text} />
      <Circle cx={12} cy={12} r={1.7} fill={colors.text} />
      <Circle cx={17} cy={12} r={1.7} fill={colors.text} />
    </Svg>
  );
};

export const CATEGORIES: CategoryListItem[] = [
  { label: "All", icon: <AllSvg /> },
  { label: "Burger", icon: <BurgerSvg /> },
  { label: "Pizza", icon: <PizzaSvg /> },
  { label: "Sandwich", icon: <SandWitchSvg /> },
  { label: "More", icon: <MoreIcon /> },
];
