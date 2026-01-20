import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://api.yourdomain.com", // 🔴 change
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
