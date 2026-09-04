import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Camera,
  type CameraRef,
  Map as MapLibreMap,
  type MapRef,
  Marker,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import useLocation from '../hooks/useLocation';
import { LocateMapSvg } from '../assets/svg';
import { useLocationStore } from '../store/useLocationStore';
import { colors } from '../styles/theme';

export type MapCoordinates = {
  longitude: number;
  latitude: number;
};

type MapViewProps = {
  selectedCoordinates?: MapCoordinates | null;
  onSelectCoordinates?: (coordinates: MapCoordinates) => void;
  containerStyle?: StyleProp<ViewStyle>;
  showSelectedLabel?: boolean;
};

const DEFAULT_LOCATION: [number, number] = [55.2708, 25.2048];

const MAP_STYLE_URLS = {
  cartoVoyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  cartoPositron:
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  osmBright: 'https://tiles.stadiamaps.com/styles/osm-bright/style.json',
  osmTopo: 'https://tiles.stadiamaps.com/styles/topo/style.json',
  openMapTilesPositron:
    'https://openmaptiles.github.io/positron-gl-style/style-cdn.json',
  openMapTilesDark:
    'https://openmaptiles.github.io/dark-matter-gl-style/style-cdn.json',
  maplibreDemo: 'https://demotiles.maplibre.org/style.json',
};

const MAP_STYLE_URL = MAP_STYLE_URLS.cartoVoyager;

export default function MapView({
  selectedCoordinates,
  onSelectCoordinates,
  containerStyle,
  showSelectedLabel = false,
}: MapViewProps) {
  const { getPhysicalLocations, loading } = useLocation();
  const coords = useLocationStore(state => state.coords);
  const cameraRef = useRef<CameraRef | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const visibleCenterRef = useRef<[number, number]>(DEFAULT_LOCATION);
  const centerOnLocationRequestRef = useRef(false);
  const skipNextSelectionCameraRef = useRef(false);
  const [zoom, setZoom] = useState(12);
  const [localSelection, setLocalSelection] = useState<MapCoordinates | null>(
    selectedCoordinates || null,
  );

  const selectedPoint = selectedCoordinates || localSelection;
  const centerSelectionEnabled = Boolean(
    onSelectCoordinates || showSelectedLabel,
  );
  const cameraCenter = useMemo<[number, number]>(() => {
    if (selectedPoint) {
      return [selectedPoint.longitude, selectedPoint.latitude];
    }

    if (coords) {
      return [coords.longitude, coords.latitude];
    }

    return DEFAULT_LOCATION;
  }, [coords, selectedPoint]);

  const updateSelection = useCallback(
    (nextSelection: MapCoordinates) => {
      setLocalSelection(nextSelection);
      onSelectCoordinates?.(nextSelection);
    },
    [onSelectCoordinates],
  );

  const moveCameraTo = useCallback(
    (center: [number, number], nextZoom: number, duration = 400) => {
      visibleCenterRef.current = center;
      setZoom(nextZoom);
      cameraRef.current?.easeTo({
        center,
        zoom: nextZoom,
        duration,
      });
    },
    [],
  );

  useEffect(() => {
    if (!coords && !selectedPoint) {
      getPhysicalLocations();
      return;
    }

    if (coords && centerOnLocationRequestRef.current) {
      centerOnLocationRequestRef.current = false;

      const currentLocation = {
        longitude: coords.longitude,
        latitude: coords.latitude,
      };

      updateSelection(currentLocation);
      moveCameraTo([coords.longitude, coords.latitude], 16, 700);
      return;
    }

    if (skipNextSelectionCameraRef.current) {
      skipNextSelectionCameraRef.current = false;
      return;
    }

    moveCameraTo(cameraCenter, selectedPoint ? 16 : 14, 700);
  }, [
    cameraCenter,
    coords,
    getPhysicalLocations,
    moveCameraTo,
    selectedPoint,
    updateSelection,
  ]);

  const moveCamera = (nextZoom: number) => {
    moveCameraTo(
      centerSelectionEnabled ? visibleCenterRef.current : cameraCenter,
      nextZoom,
    );
  };

  const handleZoomIn = () => {
    const nextZoom = Math.min(zoom + 1, 20);
    setZoom(nextZoom);
    moveCamera(nextZoom);
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(zoom - 1, 3);
    setZoom(nextZoom);
    moveCamera(nextZoom);
  };

  const handleLocationPress = () => {
    centerOnLocationRequestRef.current = true;
    getPhysicalLocations();
  };

  const handleMapPress = (event: any) => {
    const lngLat = event?.nativeEvent?.lngLat;
    if (!Array.isArray(lngLat) || lngLat.length < 2) {
      return;
    }

    const nextSelection = {
      longitude: Number(lngLat[0]),
      latitude: Number(lngLat[1]),
    };

    updateSelection(nextSelection);
  };

  const handleRegionDidChange = (
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) => {
    const { center, userInteraction, zoom: nextZoom } = event.nativeEvent;

    if (typeof nextZoom === 'number') {
      setZoom(nextZoom);
    }

    if (!centerSelectionEnabled || !userInteraction) {
      return;
    }

    if (!Array.isArray(center) || center.length < 2) {
      return;
    }

    const nextCenter: [number, number] = [Number(center[0]), Number(center[1])];

    visibleCenterRef.current = nextCenter;
    skipNextSelectionCameraRef.current = true;
    updateSelection({
      longitude: nextCenter[0],
      latitude: nextCenter[1],
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <MapLibreMap
        ref={mapRef}
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        androidView="surface"
        attributionPosition={{ bottom: 8, right: 8 }}
        compass={false}
        dragPan
        onPress={handleMapPress}
        onRegionDidChange={handleRegionDidChange}
        scaleBar={false}
        touchPitch={false}
        touchRotate={false}
        touchZoom
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: cameraCenter, zoom: 12 }}
        />

        {coords ? (
          <Marker
            id="current-location-marker"
            lngLat={[coords.longitude, coords.latitude]}
          >
            <View style={styles.currentLocationMarker} />
          </Marker>
        ) : null}

        {selectedPoint && !centerSelectionEnabled ? (
          <Marker
            id="selected-location-marker"
            lngLat={[selectedPoint.longitude, selectedPoint.latitude]}
          >
            <View style={styles.selectedLocationMarker}>
              <View style={styles.selectedLocationDot} />
            </View>
          </Marker>
        ) : null}
      </MapLibreMap>

      {centerSelectionEnabled ? (
        <View pointerEvents="none" style={styles.centerPicker}>
          <View style={styles.selectedLocationMarker}>
            <View style={styles.selectedLocationDot} />
          </View>
          <View style={styles.centerPickerStem} />
        </View>
      ) : null}

      {showSelectedLabel && selectedPoint ? (
        <View style={styles.selectedLabel}>
          <Text style={styles.selectedLabelText}>
            {selectedPoint.latitude.toFixed(5)},{' '}
            {selectedPoint.longitude.toFixed(5)}
          </Text>
        </View>
      ) : null}

      <View style={styles.mapActions}>
        <View style={styles.zoomControls}>
          <Pressable
            style={styles.iconButton}
            onPress={handleLocationPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <LocateMapSvg height={40} />
            )}
          </Pressable>

          <Pressable style={styles.zoomButton} onPress={handleZoomIn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11h14v2H5z" fill={colors.text} />
              <Path d="M11 5h2v14h-2z" fill={colors.text} />
            </Svg>
          </Pressable>
          <View style={styles.zoomControlSpacer} />
          <Pressable style={styles.zoomButton} onPress={handleZoomOut}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11h14v2H5z" fill={colors.text} />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  mapActions: {
    position: 'absolute',
    top: 14,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomControlSpacer: {
    width: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControls: {
    width: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    elevation: 2,
  },
  centerPicker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -13,
    marginTop: -18,
    alignItems: 'center',
  },
  centerPickerStem: {
    width: 3,
    height: 12,
    marginTop: -2,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  selectedLabel: {
    position: 'absolute',
    left: 12,
    right: 64,
    bottom: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(20, 33, 31, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  selectedLabelText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
  },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  selectedLocationMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
