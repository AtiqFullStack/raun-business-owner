import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../styles/theme';

type BannerCarouselProps = {
  slides: React.ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  aspectRatio?: number;
  containerStyle?: StyleProp<ViewStyle>;
  slideStyle?: StyleProp<ViewStyle>;
};

export default function BannerCarousel({
  slides,
  autoPlay = true,
  autoPlayInterval = 3500,
  aspectRatio = 356 / 230,
  containerStyle,
  slideStyle,
}: BannerCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);

  useEffect(() => {
    if (!autoPlay || carouselWidth === 0 || slides.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % slides.length;
      scrollRef.current?.scrollTo({
        animated: true,
        x: nextIndex * carouselWidth,
      });
      setCurrentIndex(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, carouselWidth, slides.length]);

  const setCurrentIndex = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setCarouselWidth(event.nativeEvent.layout.width);
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (carouselWidth === 0) {
      return;
    }

    const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View onLayout={handleLayout} style={[styles.container, { aspectRatio }]}>
        {carouselWidth > 0 ? (
          <Animated.ScrollView
            ref={scrollRef}
            bounces={false}
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={handleMomentumEnd}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            {slides.map((slide, index) => {
              const inputRange = [
                (index - 1) * carouselWidth,
                index * carouselWidth,
                (index + 1) * carouselWidth,
              ];
              const animatedStyle = {
                opacity: scrollX.interpolate({
                  inputRange,
                  outputRange: [0.72, 1, 0.72],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scale: scrollX.interpolate({
                      inputRange,
                      outputRange: [0.94, 1, 0.94],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              };

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.slide,
                    { width: carouselWidth },
                    animatedStyle,
                    slideStyle,
                  ]}
                >
                  {slide}
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        ) : null}
      </View>

      {carouselWidth > 0 && slides.length > 1 ? (
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * carouselWidth,
              index * carouselWidth,
              (index + 1) * carouselWidth,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 8, 6],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.45, 1, 0.45],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index && styles.dotActive,
                  {
                    opacity: dotOpacity,
                    width: dotWidth,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 7,
  },
  dot: {
    backgroundColor: colors.borderDark,
    borderRadius: 3,
    height: 6,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
});
