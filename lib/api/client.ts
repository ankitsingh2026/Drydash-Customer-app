import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://customer.shiptos.com", // new backend
  // baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

export const oldApiClient = axios.create({
  baseURL: "https://api.shiptos.com/api", // old backend
  headers: { "Content-Type": "application/json" },
});


export const multipartApiClient = axios.create({
    baseURL: "https://api.shiptos.com/api", // old backend
    headers: {
    "Content-Type": "multipart/form-data",
  },
})
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

oldApiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const BASE_URL = "https://api.shiptos.com"; 