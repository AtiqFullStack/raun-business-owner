import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CategoryList, {
  type CategoryListItem,
} from '../components/CategoryList';
import CommonHeader, { HeaderSearchInput } from '../components/CommonHeader';
import { CATEGORIES } from '../constants/categories';
import { navigate } from '../navigation/navigationRef';
import {IMAGE_BASE_URL } from '../var/config';
import {
  getCategoryImageUrl,
  useCategoryService,
  type Category,
} from '../services/categoryService';
import { useRestaurant } from '../store/useRestaurant';
import { colors } from '../styles/theme';
import {
  useRestaurantServices,
  type Restaurant as ApiRestaurant,
  type GetRestaurantsParams,
} from '../services/resturantServices';
import { useSearchService } from '../services/searchService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PopularRestaurants'>;

const keyExtractor = (item: ApiRestaurant) => item._id;

const mapCategoryToListItem = (category: Category): CategoryListItem => ({
  id: category._id,
  label: category.title,
  imageUrl: getCategoryImageUrl(category.image?.url),
});

export default function PopularResturants({ route }: Props) {
  const categoryTitle = route?.params?.categoryTitle;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryListItem[]>(CATEGORIES);
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const { getCategories } = useCategoryService();
  const { getRestaurants, loading } = useRestaurantServices();
  const { searchByCategory } = useSearchService();
  const setSelectedRestaurant = useRestaurant(state => state.setSelectedRestaurant);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback((query: string, category: string) => {
    // category filter active hai
    if (category !== 'All') {
      searchByCategory({ categoryTitle: category })
        .then(res => setRestaurants(res.data.restaurants ?? []))
        .catch(() => {});
      return;
    }

    // search query hai
    const search = query.trim();
    const params: GetRestaurantsParams = { page: 1, limit: 20 };
    if (search) params.search = search;

    getRestaurants(params)
      .then(res => setRestaurants(res.data.restaurants ?? []))
      .catch(() => {});

    getCategories({ active: true, limit: 100, ...(search ? { search } : {}) })
      .then(res => {
        const apiCategories = res.data.categories.map(mapCategoryToListItem);
        setCategories(apiCategories.length > 0 ? [CATEGORIES[0], ...apiCategories] : []);
      })
      .catch(() => {});
  }, [searchByCategory, getRestaurants, getCategories]);

  // searchQuery pe debounce, selectedCategory pe immediate
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = searchQuery ? 400 : 0;
    debounceRef.current = setTimeout(() => {
      fetchData(searchQuery, selectedCategory);
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategory, fetchData]);



  const emptyMessage = useMemo(() => {
    if (loading) return '';
    if (selectedCategory === 'All' || selectedCategory === 'More')
      return 'No restaurants found';
    return `No ${selectedCategory.toLowerCase()} restaurants found`;
  }, [selectedCategory, loading]);

  const openRestaurant = (restaurant: ApiRestaurant) => {
    setSelectedRestaurant(restaurant as any);
    navigate('RestaurantDetails', { restaurantId: restaurant._id });
  };

  const renderRestaurant = ({ item }: { item: ApiRestaurant }) => (
    <RestaurantCard restaurant={item} onPress={() => openRestaurant(item)} />
  );

  return (
    <View style={styles.screen}>
      <RestaurantListHeader
        categories={categories}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        title={categoryTitle ? `${categoryTitle} Restaurants` : 'All Restaurants'}
      />

      <Text style={styles.sectionTitle}>Popular Restaurant</Text>

      <FlatList
        bounces={false}
        contentContainerStyle={styles.listContent}
        data={restaurants}
        keyExtractor={keyExtractor}
        ListEmptyComponent={<EmptyState message={emptyMessage} />}
        renderItem={renderRestaurant}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function RestaurantListHeader({
  categories,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  title,
}: {
  categories: CategoryListItem[];
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  title?: string;
}) {
  return (
    <>
      <CommonHeader
        title={title ?? 'All Restaurants'}
        bottomPadding={18}
        horizontalPadding={14}
        titleStyle={styles.headerTitle}
      >
        <HeaderSearchInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="What are you looking for?"
          style={styles.searchInput}
          rightElement={
            searchQuery.length > 0 ? (
              <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
                <ClearIcon />
              </Pressable>
            ) : null
          }
        />
      </CommonHeader>

      <View style={styles.categoryWrap}>
        <CategoryList
          data={categories}
          selectedKey={selectedCategory}
          keyExtractor={item => item.label}
          onPress={item => onCategoryChange(item.label)}
          contentContainerStyle={styles.categoryContent}
        />
      </View>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: ApiRestaurant;
  onPress: () => void;
}) {
  const imageUrl = restaurant.images?.[0]?.url
    ? `${IMAGE_BASE_URL.replace(/\/$/, '')}${restaurant.images[0].url}`
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={imageUrl ? { uri: imageUrl } : undefined} style={styles.cardImage} />

      <View style={styles.cardBody}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurant.name}
        </Text>

        <View style={styles.metaRow}>
          <MetaItem icon={<ClockIcon />} text={`${restaurant.openingTime} - ${restaurant.closingTime}`} />
          {restaurant.location?.address ? (
            <>
              <MetaDivider />
              <MetaItem icon={<LocationIcon />} text={restaurant.location.address} />
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function MetaDivider() {
  return <View style={styles.metaDivider} />;
}

function ClockIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={8}
        stroke={colors.textMuted}
        strokeWidth={2.2}
      />
      <Path
        d="M12 7.8v4.5l3 1.8"
        stroke={colors.textMuted}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

function LocationIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
        fill={colors.textMuted}
      />
      <Circle cx={12} cy={10} r={2.4} fill={colors.textLight} />
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill="rgba(255,255,255,0.25)" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={colors.textLight}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  listContent: {
    paddingBottom: 18,
    paddingTop: 8,
  },
  list: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  searchInput: {
    fontSize: 11,
  },
  categoryContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  categoryWrap: {
    height: 92,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginHorizontal: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: 14,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardImage: {
    aspectRatio: 2.58,
    backgroundColor: colors.surfaceMuted,
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  restaurantName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    minWidth: 0,
  },
  metaText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
  },
  metaDivider: {
    backgroundColor: colors.borderDark,
    height: 9,
    width: StyleSheet.hairlineWidth,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
