import Svg, { Circle, Rect } from "react-native-svg";
import { colors } from "../../../styles/theme";

export default function NonVegIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Rect
        x={1.2}
        y={1.2}
        width={11.6}
        height={11.6}
        rx={1.4}
        stroke={colors.primary}
        strokeWidth={1.2}
      />
      <Circle cx={7} cy={7} r={2.6} fill={colors.primary} />
    </Svg>
  );
}