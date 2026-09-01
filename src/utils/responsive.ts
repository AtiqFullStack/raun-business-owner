import { Dimensions } from "react-native";

const { height, width } = Dimensions.get("screen");

export const vw = (percentage: number) => {
  return (width * percentage) / 100;
};

export const vh = (percentage: number) => {
  return (height * percentage) / 100;
};
