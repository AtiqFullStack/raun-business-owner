import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Path, SvgUri } from 'react-native-svg';
import { LocationSvg, NotificationSvg } from '../assets/svg';
import { colors } from '../styles/theme';
import Logo from '../assets/svg/Code/Logo';
import { CATEGORIES } from '../constants/categories';
import CategoryList, {
  type CategoryListItem,
} from '../components/CategoryList';
import { navigate } from '../navigation/navigationRef';
import BannerCarousel from '../components/BannerCarousel';
import {
  getCategoryImageUrl,
  useCategoryService,
  type Category,
} from '../services/categoryService';
import {
  getBannerImageUrl,
  useBannerService,
  type Banner,
} from '../services/bannerService';
import {
  getServiceImageUrl,
  useServiceService,
  type Service,
} from '../services/serviceService';
import {
  useRestaurantServices,
  type Restaurant as ApiRestaurant,
} from '../services/resturantServices';
import { useSearchService } from '../services/searchService';
import { useServiceStore } from '../store/useService';
import RightArrow from '../assets/svg/Code/RightArrow';
import { useLocationStore } from '../store/useLocationStore';

import getImageUrl from '../utils/urlConvertor';



const mapCategoryToListItem = (category: Category): CategoryListItem => ({
  id: category._id,
  label: category.title,
  imageUrl: getCategoryImageUrl(category.image?.url),
});

const isSvgImage = (url = '') => {
  return url.split('?')[0].toLowerCase().endsWith('.svg');
};

const formatServiceLabel = (name: string) => name.trim().replace(/\s+/, '\n');

const mapBannerToSlide = (banner: Banner) => {
  const imageUrl = getBannerImageUrl(banner.image?.url);

  if (!imageUrl) {
    return null;
  }

  if (isSvgImage(imageUrl)) {
    return <SvgUri height="100%" uri={imageUrl} width="100%" />;
  }

  return (
    <Image
      accessibilityLabel={banner.title}
      resizeMode="cover"
      source={{ uri: imageUrl }}
      style={styles.bannerImage}
    />
  );
};

export default function HomeScreen() {
  const { getServices } = useServiceService();
  const { getCategories } = useCategoryService();
  const { getBanners } = useBannerService();
  const { getRestaurants } = useRestaurantServices();
  const { searchByCategory } = useSearchService();
  const services = useServiceStore(state => state.services);
  const selectedServiceId = useServiceStore(state => state.selectedServiceId);
  const setServices = useServiceStore(state => state.setServices);
  const setSelectedService = useServiceStore(state => state.setSelectedService);
  const physicalLocation = useLocationStore(state => state.physicalLocation);
  const locationLoading = useLocationStore(state => state.loading);
  const [categories, setCategories] = useState<CategoryListItem[]>(CATEGORIES);
  const [bannerSlides, setBannerSlides] = useState<React.ReactNode[]>([]);
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredRestaurants, setFilteredRestaurants] = useState<ApiRestaurant[]>([]);
  const headerLocation =
    physicalLocation ||
    (locationLoading ? 'Fetching location...' : 'Select location');

  const fetchAll = useCallback(async () => {
    setRestaurantsLoading(true);
    try {
      const [restaurantRes, categoryRes, bannerRes] = await Promise.allSettled([
        getRestaurants({ page: 1, limit: 20 }),
        selectedServiceId ? getCategories({ active: true, limit: 100 }) : Promise.resolve(null),
        selectedServiceId ? getBanners() : Promise.resolve(null),
      ]);

      if (restaurantRes.status === 'fulfilled') {
        const list = restaurantRes.value.data.restaurants ?? [];
        setRestaurants(list);
        setFilteredRestaurants(list);
      }

      if (categoryRes.status === 'fulfilled' && categoryRes.value)
        setCategories([CATEGORIES[0], ...categoryRes.value.data.categories.map(mapCategoryToListItem)]);

      if (bannerRes.status === 'fulfilled' && bannerRes.value)
        setBannerSlides(bannerRes.value.data.banners.map(mapBannerToSlide).filter(Boolean) as React.ReactNode[]);
    } catch {}
    setRestaurantsLoading(false);
  }, [getRestaurants, getCategories, getBanners, selectedServiceId]);

  useEffect(() => {
    let isMounted = true;
    getServices()
      .then(response => { if (isMounted) setServices(response.data.services); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [getServices, setServices]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCategoryPress = (item: CategoryListItem) => {
    const next = selectedCategory === item.label ? null : item.label;
    setSelectedCategory(next);
    if (!next || next === 'All') {
      setFilteredRestaurants(restaurants);
      return;
    }
    searchByCategory({ categoryTitle: next })
      .then(res => setFilteredRestaurants(res.data.restaurants ?? []))
      .catch(() => setFilteredRestaurants([]));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces={true}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate('SelectLocation')}
              style={({ pressed }) => [
                styles.locationRow,
                pressed && styles.pressed,
              ]}
            >
              <LocationSvg height={16} width={16} />
              <Text style={styles.locationText} numberOfLines={2}>
                {headerLocation}
              </Text>
            </Pressable>

            <Logo height={20} />
            {/* 
            <Text style={styles.logo}>
              <Text style={styles.logoAccent}>r</Text>aun
            </Text> */}

            <Pressable style={styles.bellButton}>
              <NotificationSvg />
              <View style={styles.badge} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <SearchIcon />
            <TextInput
              placeholder="What are you looking for?"
              placeholderTextColor="rgba(255,255,255,0.56)"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.serviceRow}>
            {services.map(item => {
              const active = item._id === selectedServiceId;

              return (
                <TouchableOpacity
                  activeOpacity={0.95}
                  key={item._id}
                  onPress={() => setSelectedService(item._id)}
                  style={[
                    styles.serviceCard,
                    active && styles.serviceCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.serviceIcon,
                      // active && styles.serviceIconActive,
                    ]}
                  >
                    <ServiceIcon service={item} />
                  </View>
                  <Text
                    style={[
                      styles.serviceLabel,
                      active && styles.serviceLabelActive,
                    ]}
                  >
                    {formatServiceLabel(item.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.body}>
          {bannerSlides.length > 0 ? (
            <BannerCarousel
              slides={bannerSlides}
              containerStyle={styles.bannerCarousel}
            />
          ) : null}

          <CategoryList
            data={categories}
            selectedKey={selectedCategory ?? 'All'}
            keyExtractor={item => item.label}
            onPress={handleCategoryPress}
          />

          <RestaurantSection
            restaurants={filteredRestaurants}
            loading={restaurantsLoading}
            title="Popular Restaurant"
            categoryTitle={selectedCategory}
          />
          <RestaurantSection
            restaurants={filteredRestaurants}
            loading={restaurantsLoading}
            title="Recommended With Deals"
            categoryTitle={selectedCategory}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceIcon({ service }: { service: Service }) {
  const imageUrl = getServiceImageUrl(service.image?.url);

  if (!imageUrl) {
    return null;
  }

  if (isSvgImage(imageUrl)) {
    return <SvgUri height={40} uri={imageUrl} width={40} />;
  }

  return (
    <Image
      accessibilityLabel={service.name}
      resizeMode="contain"
      source={{ uri: imageUrl }}
      style={styles.serviceImage}
    />
  );
}

function RestaurantSection({
  restaurants,
  loading,
  title,
  categoryTitle,
}: {
  restaurants: ApiRestaurant[];
  loading?: boolean;
  title: string;
  categoryTitle?: string | null;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {categoryTitle ? `${categoryTitle} — ${title}` : title}
        </Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() =>
            navigate('PopularRestaurants', categoryTitle ? { categoryTitle } : undefined)
          }
        >
          <Text style={styles.viewAll}>View All </Text>
          <RightArrow />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.restaurantRow}
          showsHorizontalScrollIndicator={false}
        >
          {restaurants.map((item) => {
            const imageUrl = getImageUrl(item.images?.[0]?.url);
            return (
              <Pressable
                key={item._id}
                style={styles.restaurantCard}
                onPress={() => navigate('RestaurantDetails', { restaurantId: item._id })}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.restaurantImage} />
                ) : (
                  <View style={[styles.restaurantImage, styles.restaurantImagePlaceholder]} />
                )}
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.ratingRow}>
                  <StarIcon />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function SearchIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={10.5}
        cy={10.5}
        r={6.5}
        stroke={colors.textLight}
        strokeWidth={2}
      />
      <Path
        d="m16 16 4 4"
        stroke={colors.textLight}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 2 2.8 6 6.5.8-4.8 4.5 1.2 6.4L12 16.5l-5.7 3.2 1.2-6.4-4.8-4.5L9.2 8 12 2Z"
        fill={colors.primary}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.screen,
    flex: 1,
  },
  content: {
    paddingBottom: 116,
  },
  header: {
    backgroundColor: colors.secondaryDark,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 56,
    paddingHorizontal: 26,
    paddingTop: 18,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    width: 92,
  },
  locationText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 12,
  },
  logo: {
    color: colors.textLight,
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 0,
  },
  logoAccent: {
    color: colors.primary,
  },
  bellButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: 32,
  },
  pressed: {
    opacity: 0.78,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 7,
    top: 6,
    width: 8,
  },
  searchBox: {
    alignItems: 'center',

    borderRadius: 4,

    flexDirection: 'row',
    height: 43,
    marginTop: 20,
    paddingHorizontal: 12,
    borderColor: colors.serachnputBorder,
    borderWidth: 1,
    marginBottom: 35,
  },
  searchInput: {
    color: colors.Searchplaceholder,
    flex: 1,
    fontSize: 14,
    marginLeft: 9,
    paddingVertical: 0,
  },
  serviceRow: {
    bottom: -46,
    flexDirection: 'row',
    gap: 12,
    left: 26,
    position: 'absolute',
    right: 26,
  },
  serviceCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    minHeight: 102,
    paddingHorizontal: 5,
    paddingTop: 12,
  },
  serviceCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  serviceIcon: {
    alignItems: 'center',
    // height: 50,
    justifyContent: 'center',
    // width: 50,
  },
  serviceIconActive: {
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  serviceImage: {
    height: 40,
    width: 40,
  },
  serviceLabel: {
    color: colors.secondaryDark,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  serviceLabelActive: {
    color: colors.secondaryDark,
  },
  body: {
    paddingHorizontal: 26,
    paddingTop: 66,
  },
  bannerCarousel: {
    marginBottom: 12,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  hero: {
    backgroundColor: colors.secondaryDark,
    borderRadius: 10,
    flexDirection: 'row',
    minHeight: 172,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCopy: {
    flex: 1,
    paddingBottom: 16,
    paddingLeft: 14,
    paddingTop: 14,
    zIndex: 1,
  },
  heroBrand: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 18,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 7,
    maxWidth: 132,
  },
  heroButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroButtonText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
  },
  heroButtonArrow: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  heroImage: {
    bottom: 0,
    height: 162,
    position: 'absolute',
    right: -8,
    width: 180,
  },
  favoriteBubble: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 9,
    width: 40,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  viewAll: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  restaurantRow: {
    gap: 12,
    paddingBottom: 2,
  },
  restaurantCard: {
    backgroundColor: colors.surface,
    borderRadius: 5,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    width: 112,
  },
  restaurantImage: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    height: 58,
    width: '100%',
  },
  restaurantImagePlaceholder: {
    backgroundColor: colors.screen,
  },
  restaurantName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 8,
    marginTop: 8,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  ratingText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
});
