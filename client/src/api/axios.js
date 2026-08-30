import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken =
      useAuthStore.getState().accessToken;

    console.log("🔐 Axios accessToken:", accessToken);
    console.log("🌐 Axios request:", config.url);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("✅ Authorization header attached");
    } else {
      console.log("❌ NO ACCESS TOKEN");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;