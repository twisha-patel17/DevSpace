import axios from "axios";
import useAuthStore from "../store/authStore";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
baseURL,
headers: {
"Content-Type": "application/json",
},
});

// Separate instance for refreshing tokens.
// It avoids running the refresh request through the normal API interceptors.
const refreshApi = axios.create({
baseURL,
headers: {
"Content-Type": "application/json",
},
});

api.interceptors.request.use(
(config) => {
const accessToken = useAuthStore.getState().accessToken;

if (accessToken) {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${accessToken}`;
}

return config;

},
(error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
failedQueue.forEach(({ resolve, reject }) => {
if (error) {
reject(error);
} else {
resolve(token);
}
});

failedQueue = [];
};

const redirectToLogin = () => {
if (window.location.pathname !== "/login") {
window.location.replace("/login");
}
};

api.interceptors.response.use(
(response) => response,
async (error) => {
const originalRequest = error.config;
const status = error.response?.status;
const requestUrl = originalRequest?.url || "";

const isAuthRequest =
  requestUrl.includes("/auth/login") ||
  requestUrl.includes("/auth/register") ||
  requestUrl.includes("/auth/refresh");

if (
  status !== 401 ||
  !originalRequest ||
  originalRequest._retry ||
  isAuthRequest
) {
  return Promise.reject(error);
}

const { refreshToken, setAccessToken, logout } =
  useAuthStore.getState();

if (!refreshToken) {
  logout();
  redirectToLogin();
  return Promise.reject(error);
}

// Wait for the current refresh operation instead of starting another.
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then((newAccessToken) => {
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization =
      `Bearer ${newAccessToken}`;

    return api(originalRequest);
  });
}

originalRequest._retry = true;
isRefreshing = true;

try {
  const response = await refreshApi.post("/auth/refresh", {
    refreshToken,
  });

  const newAccessToken = response.data?.accessToken;

  if (!newAccessToken) {
    throw new Error(
      "Refresh response did not contain an access token"
    );
  }

  setAccessToken(newAccessToken);

  processQueue(null, newAccessToken);

  originalRequest.headers = originalRequest.headers || {};
  originalRequest.headers.Authorization =
    `Bearer ${newAccessToken}`;

  return await api(originalRequest);
} catch (refreshError) {
  processQueue(refreshError);

  logout();
  redirectToLogin();

  return Promise.reject(refreshError);
} finally {
  isRefreshing = false;
}
}
);

export default api;
