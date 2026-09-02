import { Dimensions } from "react-native";

const { height, width } = Dimensions.get("screen");

const FIGMA_WIDTH = 441;

export const scale = (size: number) => {
  return (width / FIGMA_WIDTH) * size;
};

export const vw = (percentage: number) => {
  return (width * percentage) / 100;
};

export const vh = (percentage: number) => {
  return (height * percentage) / 100;
};
