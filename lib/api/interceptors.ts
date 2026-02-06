import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshTokenApi } from "../../features/auth/auth.api";
import { apiClient } from "../../lib/api/client";

let isRefreshing = false;
let failedQueue: any = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom: any) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = () => {
  apiClient.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");

          if (!refreshToken) throw new Error("No refresh token");

          const res = await refreshTokenApi(refreshToken);

          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          await AsyncStorage.multiSet([
            ["accessToken", newAccessToken],
            ["refreshToken", newRefreshToken],
          ]);

          apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);

          return apiClient(originalRequest);
        } catch (err) {
          processQueue(err, null);

          // 🔴 logout user
          await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
};
