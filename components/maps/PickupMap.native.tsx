import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function PickupMap({
  location,
  onSelect,
}: {
  location: { latitude: number; longitude: number };
  onSelect: (c: { latitude: number; longitude: number }) => void;
}) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}   // 👈 fills parent height
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => onSelect(e.nativeEvent.coordinate)}
      >
        <Marker coordinate={location} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,          // 👈 critical
    width: "100%",
  },
  map: {
    flex: 1,          // 👈 critical
    width: "100%",
    height: "100%",  // 👈 critical on Android
  },
});
