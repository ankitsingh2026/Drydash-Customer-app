import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://live.drydash.in",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
