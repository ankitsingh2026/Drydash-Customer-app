// services/serviceApi.js

// import { oldApiClient } from "@/lib/api/client";

// export const checkServiceAvailability = async (latitude, longitude) => {
//   try {
//     console.log("this is the lag and long", latitude, longitude);
//     // Step 1: Resolve zone from coordinates
//     const zoneResponse = await oldApiClient.get(
//       `v1/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
//     );

//     if (!zoneResponse.data.zoneFound) {
//       return {
//         serviceAvailable: false,
//         message: "We're not in your area yet",
//         subMessage: "But we're expanding soon!",
//         type: "OUT_OF_AREA",
//       };
//     }

//     // Step 2: Check service availability for the zone
//     const serviceResponse = await oldApiClient.post(`v1/slots/service/check`, {
//       zoneId: zoneResponse.data.zoneId,
//     });

//     console.log("this is the serviceResposne==>>", serviceResponse.data);

//     if (!serviceResponse.data.serviceAvailable) {
//       return {
//         serviceAvailable: false,
//         message: "Currently not serviceable",
//         subMessage: "Please check back later",
//         type: "NOT_AVAILABLE_NOW",
//       };
//     }

//     // Service is available
//     return {
//       serviceAvailable: true,
//       message: "Now accepting orders",
//       subMessage: "Delivery in 10-15 mins",
//       type: "AVAILABLE",
//     };
//   } catch (error) {
//     console.error("Service check error:", error);
//     return {
//       serviceAvailable: false,
//       message: "Unable to check service",
//       subMessage: "Please try again",
//       type: "ERROR",
//     };
//   }
// };

// export const getLocationDetails = async (latitude, longitude) => {
//   try {
//     const response = await oldApiClient.get(
//       `v1/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Location resolve error:", error);
//     return null;
//   }
// };

// services/serviceApi.js

import { oldApiClient } from "@/lib/api/client";

export const checkServiceAvailability = async (latitude, longitude) => {
  try {
    console.log("this is the lat and long", latitude, longitude);

    // Step 1: Resolve zone from coordinates
    const zoneResponse = await oldApiClient.get(
      `v1/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
    );

    console.log("Zone response:", zoneResponse.data);

    if (!zoneResponse.data.zoneFound) {
      return {
        serviceAvailable: false,
        message: "We're not in your area yet",
        subMessage: "But we're expanding soon!",
        type: "OUT_OF_AREA",
      };
    }

    // Step 2: Check service availability for the zone
    const serviceResponse = await oldApiClient.post(`v1/slots/service/check`, {
      zoneId: zoneResponse.data.zoneId,
    });

    console.log("Service response:", serviceResponse.data);

    // Check if service is available
    if (serviceResponse.data.serviceAvailable === true) {
      return {
        serviceAvailable: true,
        message: "24 Hours",
        subMessage: "We are taking pickup currently",
        type: "AVAILABLE",
      };
    } else {
      // Service not available - check if it's time or area issue
      const message =
        serviceResponse.data.message || "Currently not serviceable";

      // Customize message based on response
      let displayMessage = "Currently not serviceable";
      let subMessage = "Please check back later";

      if (message.includes("time slot")) {
        displayMessage = "Currently closed";
        subMessage = "Please check back during operating hours";
      } else if (message.includes("disabled in your area")) {
        displayMessage = "Not in your area";
        subMessage = "Service is currently unavailable at this location";
      }

      return {
        serviceAvailable: false,
        message: displayMessage,
        subMessage: subMessage,
        type: "NOT_AVAILABLE_NOW",
        details: serviceResponse.data, // Include original response for debugging
      };
    }
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
      `v1/slots/location/resolve?lat=${latitude}&lng=${longitude}`,
    );
    return response.data;
  } catch (error) {
    console.error("Location resolve error:", error);
    return null;
  }
};

// services/location.api.ts (modify getFullServiceData)

type CacheEntry = {
  data: any;
  timestamp: number;
};

const serviceCache = new Map<string, CacheEntry>(); // key: "lat,lng"
const CACHE_DURATION = 30000; // 30s

export const getFullServiceData = async (
  latitude: number,
  longitude: number,
  forceRefresh = false
) => {
  const cacheKey = `${latitude},${longitude}`;
  const cached = serviceCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("📦 Returning cached data for", cacheKey);
    return cached.data;
  }

  try {
    console.log("🔄 Fetching full service data for", latitude, longitude);

    // 1. Resolve zone
    const zoneRes = await oldApiClient.get(
      `v1/slots/location/resolve?lat=${latitude}&lng=${longitude}`
    );
    const zoneData = zoneRes.data;
    console.log("Zone data====>:", zoneData);

    if (!zoneData.zoneFound) {
      const result = { coords: { lat: latitude, lng: longitude }, zoneData, serviceData: null };
      serviceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }

    // 2. Check service + slots
    const serviceRes = await oldApiClient.post(`v1/slots/service/check`, {
      zoneId: zoneData.zoneId,
    });
    const serviceData = serviceRes.data;
    console.log("Service data====>:", serviceData);

    const result = {
      coords: { lat: latitude, lng: longitude },
      zoneData,
      serviceData,
    };

    serviceCache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log("✅ Full service data cached for", cacheKey);
    return result;
  } catch (error) {
    console.error("❌ Full service error:", error);
    return {
      coords: { lat: latitude, lng: longitude },
      zoneData: null,
      serviceData: null,
    };
  }
};
