import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RootStackParamList } from '../navigation';
import { useRestaurant } from '../store/useRestaurant';
import { colors } from '../styles/theme';
import { BackSvg } from '../assets/svg';
import {
  useRestaurantServices,
  type Restaurant as ApiRestaurant,
  type ApiMenuItem,
} from '../services/resturantServices';
import { API_BASE_URL, IMAGE_BASE_URL } from '../var/config';
import VegIcon from '../assets/svg/Code/VegIcon';
import NonVegIcon from '../assets/svg/Code/NonVegIcon';
import VegNonVeg from '../components/VegNonVeg';
import { convertToAmPm } from '../utils/dateFormat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetails'>;

const currency = (value: number) => `B$ ${value.toFixed(2)}`;

export default function RestaurantDetails({ navigation, route }: Props) {
  const { getRestaurantById } = useRestaurantServices();
  const selectedRestaurant = useRestaurant(state => state.selectedRestaurant) as ApiRestaurant | null;
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(
    selectedRestaurant?._id === route.params.restaurantId ? selectedRestaurant : null,
  );
  const [menus, setMenus] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(!restaurant);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMenus = useCallback((id: string, search?: string) => {
    getRestaurantById(id, search ? { search } : undefined)
      .then(res => setMenus(res.data.menus ?? []))
      .catch(() => {});
  }, [getRestaurantById]);

  useEffect(() => {
    setLoading(true);
    getRestaurantById(route.params.restaurantId)
      .then(res => {
        setRestaurant(res.data.restaurant);
        setMenus(res.data.menus ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.params.restaurantId]);

  // search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMenus(route.params.restaurantId, searchQuery);
    }, 340);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const toggleSearch = () => {
    const opening = !searchOpen;
    setSearchOpen(opening);
    Animated.spring(searchAnim, {
      toValue: opening ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => {
      if (opening) searchInputRef.current?.focus();
    });
    if (!opening) setSearchQuery('');
  };

  const cart = useRestaurant(state => state.cart);
  const addItem = useRestaurant(state => state.addItem);
  const removeItem = useRestaurant(state => state.removeItem);

  const cartSummary = useMemo(
    () =>
      Object.values(cart).reduce(
        (summary, line) => {
          const item = line.item as any;
          const price =
            item.price ?? item.variants?.[0]?.price ?? item.basePrice ?? 0;
          return {
            count: summary.count + line.quantity,
            total: summary.total + line.quantity * price,
          };
        },
        { count: 0, total: 0 },
      ),
    [cart],
  );

  const renderMenuItem: ListRenderItem<ApiMenuItem> = ({ item }) => (
    <MenuCard
      item={item}
      quantity={cart[item._id]?.quantity ?? 0}
      onAdd={() => addItem(item as any)}
      onRemove={() => removeItem(item._id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.emptyScreen}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        bounces={false}
        contentContainerStyle={[
          styles.content,
          cartSummary.count > 0 && styles.contentWithCart,
        ]}
        data={menus}
        keyExtractor={item => item._id}
        ListHeaderComponent={
          <DetailsHeader
            restaurant={restaurant}
            onBack={navigation.goBack}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            searchAnim={searchAnim}
            searchInputRef={searchInputRef}
            onSearchChange={setSearchQuery}
            onToggleSearch={toggleSearch}
          />
        }
        renderItem={renderMenuItem}
        showsVerticalScrollIndicator={false}
      />

      {cartSummary.count > 0 ? (
        <CartBar count={cartSummary.count} total={cartSummary.total} />
      ) : null}
    </View>
  );
}

function DetailsHeader({
  restaurant,
  onBack,
  searchOpen,
  searchQuery,
  searchAnim,
  searchInputRef,
  onSearchChange,
  onToggleSearch,
}: {
  restaurant: ApiRestaurant;
  onBack: () => void;
  searchOpen: boolean;
  searchQuery: string;
  searchAnim: Animated.Value;
  searchInputRef: React.RefObject<TextInput>;
  onSearchChange: (q: string) => void;
  onToggleSearch: () => void;
}) {
  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '72%'],
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const images = restaurant.images ?? [];
  const scrollRef = useRef<ScrollView>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);

  const startAutoScroll = () => {
    if (images.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % images.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, 3000);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  };

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [images.length]);

  const buildUri = (url: string) =>
    url.startsWith('http') ? url : `${IMAGE_BASE_URL.replace(/\/$/, '')}${url}`;

  return (
    <>
      <View style={styles.hero}>
        {images.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          >
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: buildUri(img.url) }}
                style={styles.heroImage}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={[styles.heroImage, { backgroundColor: colors.surfaceMuted }]}
          />
        )}

        <View style={styles.heroOverlay} />

        <View style={styles.heroActions}>
          <RoundIconButton onPress={onBack} icon={<BackSvg />} />
          <View style={styles.searchRow}>
            <Animated.View style={[styles.searchBarWrap, { width: searchWidth, opacity: searchOpacity }]}>
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder="Search menu..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.searchBarInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
                  <ClearIcon />
                </Pressable>
              )}
            </Animated.View>
            <RoundIconButton onPress={onToggleSearch} icon={searchOpen ? <CloseIcon /> : <SearchIcon />} />
          </View>
        </View>

        {images.length > 1 && (
          <View style={styles.heroDots}>
            {images.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  stopAutoScroll();
                  activeIndexRef.current = i;
                  setActiveIndex(i);
                  scrollRef.current?.scrollTo({
                    x: i * SCREEN_WIDTH,
                    animated: true,
                  });
                  startAutoScroll();
                }}
              >
                <View
                  style={[
                    styles.heroDot,
                    i === activeIndex && styles.heroDotActive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.summary}>
        <View style={styles.titleRow}>
          <View style={styles.titleColumn}>
            <Text style={styles.restaurantTitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
            {restaurant.location?.address ? (
              <Text style={styles.subInfo}>{restaurant.location.address}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaItem
            icon={<ClockIcon />}
            text={`${convertToAmPm(restaurant.openingTime)} - ${convertToAmPm(restaurant.closingTime)}`}
          />
          {restaurant.location?.address ? (
            <>
              <MetaDivider />
              <MetaItem
                icon={<LocationIcon />}
                text={restaurant.location.address}
              />
            </>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <FilterChip icon={<FilterIcon />} label="Filters" />
          <FilterChip icon={<VegIcon />} label="Veg" />
          <FilterChip icon={<NonVegIcon />} label="Non-Veg" />
        </View>
      </View>
    </>
  );
}

function MenuCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: ApiMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const primaryImage =
    item.images?.find(img => img.isPrimary) ?? item.images?.[0];
  const imageUri = primaryImage?.url?.startsWith('http')
    ? primaryImage.url
    : primaryImage?.url
    ? `${API_BASE_URL.replace(/\/$/, '')}${primaryImage.url}`
    : undefined;

  const displayPrice = item.variants?.[0]?.price ?? item.basePrice;
  console.log(displayPrice);
  const discountedPrice =
    item.discount?.type === 'percent'
      ? displayPrice * (1 - item.discount.value / 100)
      : displayPrice;

  return (
    <View style={styles.menuCard}>
      <View style={styles.menuInfo}>
        <VegNonVeg isVeg={item.isVeg} />
        <Text style={styles.menuName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{currency(discountedPrice)}</Text>
          {item.discount ? (
            <Text style={styles.oldPrice}>{currency(displayPrice)}</Text>
          ) : null}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.menuMedia}>
        <Image
          source={imageUri ? { uri: imageUri } : undefined}
          style={styles.menuImage}
        />
        <QuantityStepper
          quantity={quantity}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </View>
    </View>
  );
}

function QuantityStepper({
  quantity,
  onAdd,
  onRemove,
}: {
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (quantity === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+ Add</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        onPress={onRemove}
        style={styles.stepperButton}
      >
        <Text style={styles.stepperText}>-</Text>
      </Pressable>
      <Text style={styles.stepperCount}>{quantity}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={styles.stepperButton}
      >
        <Text style={styles.stepperText}>+</Text>
      </Pressable>
    </View>
  );
}

function CartBar({ count, total }: { count: number; total: number }) {
  return (
    <View style={styles.cartBar}>
      <View style={styles.cartInfo}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=120&auto=format&fit=crop',
          }}
          style={styles.cartThumb}
        />
        <View>
          <Text style={styles.cartCount}>
            {count} {count === 1 ? 'Item' : 'Items'} added
          </Text>
          <Text style={styles.cartTotal}>{currency(total)}</Text>
        </View>
      </View>

      <Pressable style={styles.continueButton}>
        <Text style={styles.continueText}>Continue</Text>
        <Text style={styles.continueArrow}>-&gt;</Text>
      </Pressable>
    </View>
  );
}

function RoundIconButton({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        pressed && styles.roundButtonPressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable style={styles.filterChip}>
      {icon}
      <Text style={styles.filterText}>{label}</Text>
    </Pressable>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function MetaDivider() {
  return <View style={styles.metaDivider} />;
}

function ClearIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill="rgba(255,255,255,0.25)" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={colors.textLight} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textLight} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={10.8}
        cy={10.8}
        r={6.6}
        stroke={colors.textLight}
        strokeWidth={2.2}
      />
      <Path
        d="m16 16 4 4"
        stroke={colors.textLight}
        strokeLinecap="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8} stroke={colors.text} strokeWidth={2} />
      <Path
        d="M12 8v4.3l3 1.7"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function LocationIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
        fill={colors.text}
      />
      <Circle cx={12} cy={10} r={2.5} fill={colors.textLight} />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h10M18 7h2M4 17h3M11 17h9"
        stroke={colors.secondary}
        strokeLinecap="round"
        strokeWidth={2}
      />
      <Circle cx={16} cy={7} r={2} stroke={colors.secondary} strokeWidth={2} />
      <Circle cx={9} cy={17} r={2} stroke={colors.secondary} strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  content: {
    paddingBottom: 18,
  },
  contentWithCart: {
    paddingBottom: 92,
  },
  emptyScreen: {
    alignItems: 'center',
    backgroundColor: colors.screen,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    aspectRatio: 1.18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    height: '100%',
    width: SCREEN_WIDTH,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    left: 14,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchBarWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    height: 36,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  searchBarInput: {
    color: colors.textLight,
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  roundButtonPressed: {
    opacity: 0.72,
  },
  heroDots: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    position: 'absolute',
  },
  heroDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  heroDotActive: {
    backgroundColor: colors.textLight,
    width: 13,
  },
  summary: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
  },
  restaurantTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  subInfo: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  ratingPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  metaDivider: {
    backgroundColor: colors.borderDark,
    height: 10,
    width: StyleSheet.hairlineWidth,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingBottom: 8,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderDark,
    borderRadius: 3,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 26,
    paddingHorizontal: 10,
  },
  filterText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    marginHorizontal: 14,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  menuInfo: {
    flex: 1,
    minWidth: 0,
  },
  menuName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  price: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  oldPrice: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  description: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
    marginTop: 5,
  },
  menuMedia: {
    position: 'relative',
    width: 92,
  },
  menuImage: {
    borderRadius: 4,
    height: 72,
    width: '100%',
  },
  stepper: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 3,
    bottom: -2,
    flexDirection: 'row',
    height: 26,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    width: 82,
  },
  stepperButton: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 24,
  },
  stepperDisabled: {
    opacity: 0.5,
  },
  addButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 3,
    bottom: -2,
    justifyContent: 'center',
    minHeight: 26,
    paddingHorizontal: 10,
    position: 'absolute',
    right: 0,
  },
  addButtonText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '900',
  },
  stepperText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  stepperCount: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '900',
  },
  cartBar: {
    alignItems: 'center',
    backgroundColor: colors.secondaryDark,
    borderRadius: 4,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 14,
    padding: 8,
    position: 'absolute',
    right: 14,
  },
  cartInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  cartThumb: {
    borderRadius: 3,
    height: 34,
    width: 34,
  },
  cartCount: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  cartTotal: {
    color: colors.secondaryLight,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 3,
    flexDirection: 'row',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 13,
  },
  continueText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '900',
  },
  continueArrow: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '900',
  },
});
