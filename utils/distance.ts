// utils/distance.ts
import { Address } from "@/types/order.types";

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function getHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest saved address within maxDistanceMeters (default 500m)
 * from given latitude & longitude.
 */
export function findNearbySavedAddress(
  currentLat: number,
  currentLng: number,
  savedAddresses: Address[],
  maxDistanceMeters: number = 500
): Address | null {
  if (
    !currentLat ||
    !currentLng ||
    !Array.isArray(savedAddresses) ||
    savedAddresses.length === 0
  ) {
    return null;
  }

  let closestAddress: Address | null = null;
  let minDistance = Infinity;

  for (const addr of savedAddresses) {
    const addrLat = Number(addr.latitude);
    const addrLng = Number(addr.longitude);

    if (isNaN(addrLat) || isNaN(addrLng) || !addrLat || !addrLng) {
      continue;
    }

    const dist = getHaversineDistanceMeters(
      currentLat,
      currentLng,
      addrLat,
      addrLng
    );
    if (dist <= maxDistanceMeters && dist < minDistance) {
      minDistance = dist;
      closestAddress = addr;
    }
  }

  return closestAddress;
}
