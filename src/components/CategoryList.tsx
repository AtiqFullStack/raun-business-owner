import React from "react";
import {
  Image,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { colors } from "../styles/theme";

export type CategoryListItem = {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  imageUrl?: string;
};

type CategoryListProps<T extends CategoryListItem = CategoryListItem> = {
  data: T[];
  selectedKey?: string;
  onPress?: (item: T, index: number) => void;
  keyExtractor?: (item: T, index: number) => string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  selectedItemStyle?: StyleProp<ViewStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  selectedIconContainerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  selectedLabelStyle?: StyleProp<TextStyle>;
  showsHorizontalScrollIndicator?: boolean;
};

const getItemKey = (item: CategoryListItem, index: number) => {
  return item.id || item.label || String(index);
};

const isSvgImage = (url = "") => {
  return url.split("?")[0].toLowerCase().endsWith(".svg");
};

export default function CategoryList<T extends CategoryListItem>({
  data,
  selectedKey,
  onPress,
  keyExtractor = getItemKey,
  contentContainerStyle,
  itemStyle,
  selectedItemStyle,
  iconContainerStyle,
  selectedIconContainerStyle,
  labelStyle,
  selectedLabelStyle,
  showsHorizontalScrollIndicator = false,
}: CategoryListProps<T>) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={[styles.row, contentContainerStyle]}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
    >
      {data.map((item, index) => {
        const itemKey = keyExtractor(item, index);
        const isSelected = selectedKey === itemKey;

        return (
          <TouchableOpacity
          activeOpacity={.6}
            key={itemKey}
            onPress={() => onPress?.(item, index)}
            style={[styles.item, itemStyle, isSelected && selectedItemStyle]}
          >
            <View
              style={[
                styles.icon,
                iconContainerStyle,
                isSelected && styles.iconSelected,
                isSelected && selectedIconContainerStyle,
              ]}
            >
              {item.imageUrl ? (
                isSvgImage(item.imageUrl) ? (
                  <SvgUri height={26} uri={item.imageUrl} width={26} />
                ) : (
                  <Image
                    resizeMode="cover"
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                  />
                )
              ) : (
                item.icon
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                labelStyle,
                isSelected && styles.labelSelected,
                isSelected && selectedLabelStyle,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 15,
    paddingVertical: 24,
  },
  item: {
    alignItems: "center",
    width: 52,
  },
  icon: {
    alignItems: "center",
    borderColor: colors.borderDark,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconSelected: {
    borderColor: colors.primary,
  },
  image: {
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  label: {
    color: colors.secondaryDark,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
  labelSelected: {
    color: colors.primary,
  },
});
