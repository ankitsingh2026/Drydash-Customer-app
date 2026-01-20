import React from "react";
import MapView, { Marker } from "react-native-maps";

export default function PickupMap({
  location,
  onSelect,
}: {
  location: { latitude: number; longitude: number };
  onSelect: (c: any) => void;
}) {
  return (
    <MapView
      style={{ height: 180 }}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onPress={(e) => onSelect(e.nativeEvent.coordinate)}
    >
      <Marker coordinate={location} />
    </MapView>
  );
}
