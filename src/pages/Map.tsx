import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Camera,
  type CameraRef,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';
import useLocation from '../hooks/useLocation';
import { LocateMapSvg } from '../assets/svg';
import { useLocationStore } from '../store/useLocationStore';

const DEFAULT_LOCATION: [number, number] = [75.823616, 26.799862];

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

// Choose the style you want to test by uncommenting one of the lines below:
const MAP_STYLE_URL = MAP_STYLE_URLS.cartoVoyager;
// const MAP_STYLE_URL = MAP_STYLE_URLS.cartoPositron;
// const MAP_STYLE_URL = MAP_STYLE_URLS.osmBright;
// const MAP_STYLE_URL = MAP_STYLE_URLS.osmTopo;
// const MAP_STYLE_URL = MAP_STYLE_URLS.openMapTilesPositron;
// const MAP_STYLE_URL = MAP_STYLE_URLS.openMapTilesDark;
// const MAP_STYLE_URL = MAP_STYLE_URLS.maplibreDemo;

export default function MapView() {
  const { getPhysicalLocations, loading } = useLocation();
  const coords = useLocationStore(state => state.coords);
  const cameraRef = useRef<CameraRef | null>(null);
  const [zoom, setZoom] = useState(12);
  // useEffect(() => {
  //   getPhysicalLocations();
  // }, []);

  console.log(coords);
  useEffect(() => {
    if (!coords) {
      getPhysicalLocations();
      return;
    }
    cameraRef.current?.easeTo({
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      duration: 700,
    });
  }, [coords]);

  const handleZoomIn = () => {
    const nextZoom = Math.min(zoom + 1, 20);
    setZoom(nextZoom);
    cameraRef.current?.easeTo({
      center: coords ? [coords.longitude, coords.latitude] : DEFAULT_LOCATION,
      zoom: nextZoom,
      duration: 400,
    });
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(zoom - 1, 3);
    setZoom(nextZoom);
    cameraRef.current?.easeTo({
      center: coords ? [coords.longitude, coords.latitude] : DEFAULT_LOCATION,
      zoom: nextZoom,
      duration: 400,
    });
  };

  const handleLocationPress = () => {
    getPhysicalLocations();
  };

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={MAP_STYLE_URL} androidView="surface">
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_LOCATION, zoom: 12 }}
        />

        <Marker id="default-marker" lngLat={DEFAULT_LOCATION}>
          <View style={styles.defaultMarker} />
        </Marker>

        {coords ? (
          <Marker
            id="current-location-marker"
            lngLat={[coords.longitude, coords.latitude]}
          >
            <View style={styles.currentLocationMarker} />
          </Marker>
        ) : null}
      </Map>

      <View style={styles.mapActions}>
        <View style={styles.zoomControls}>
          <Pressable
            style={styles.iconButton}
            onPress={handleLocationPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <LocateMapSvg height={40} />
            )}
          </Pressable>

          <Pressable style={styles.zoomButton} onPress={handleZoomIn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11h14v2H5z" fill="#000" />
              <Path d="M11 5h2v14h-2z" fill="#000" />
            </Svg>
          </Pressable>
          <View style={styles.zoomControlSpacer} />
          <Pressable style={styles.zoomButton} onPress={handleZoomOut}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11h14v2H5z" fill="#000" />
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
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  mapActions: {
    position: 'absolute',
    top: 24,
    right: 16,
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
    // backgroundColor: 'rgba(255, 0, 0, 0.65)',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    elevation: 2,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  errorText: {
    marginTop: 4,
    color: '#FF6B6B',
    fontSize: 13,
  },
  defaultMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
