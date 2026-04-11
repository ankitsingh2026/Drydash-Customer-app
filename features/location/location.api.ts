// services/serviceApi.js

import { oldApiClient } from "@/lib/api/client";

export const checkServiceAvailability = async (latitude, longitude) => {
  try {
    // Step 1: Resolve zone from coordinates
    const zoneResponse = await oldApiClient.get(
      `/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
    );

    if (!zoneResponse.data.zoneFound) {
      return {
        serviceAvailable: false,
        message: "We're not in your area yet",
        subMessage: "But we're expanding soon!",
        type: "OUT_OF_AREA",
      };
    }

    // Step 2: Check service availability for the zone
    const serviceResponse = await oldApiClient.post(`/slots/service/check`, {
      zoneId: zoneResponse.data.zoneId,
    });

    if (!serviceResponse.data.serviceAvailable) {
      return {
        serviceAvailable: false,
        message: "Currently not serviceable",
        subMessage: "Please check back later",
        type: "NOT_AVAILABLE_NOW",
      };
    }

    // Service is available
    return {
      serviceAvailable: true,
      message: "Now accepting orders",
      subMessage: "Delivery in 10-15 mins",
      type: "AVAILABLE",
    };
  } catch (error) {
    console.error("Service check error:", error);
    return {
      serviceAvailable: false,
      message: "Unable to check service",
      subMessage: "Please try again",
      type: "ERROR",
    };
  }
};

export const getLocationDetails = async (latitude, longitude) => {
  try {
    const response = await oldApiClient.get(
      `/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
    );
    return response.data;
  } catch (error) {
    console.error("Location resolve error:", error);
    return null;
  }
};
