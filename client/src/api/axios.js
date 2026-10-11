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
const accessToken = useAuthStore.getState().accessToken;

if (accessToken) {
  config.headers.Authorization = `Bearer ${accessToken}`;
}

return config;

},
(error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
failedQueue.forEach((request) => {
if (error) {
request.reject(error);
} else {
request.resolve(token);
}
});

failedQueue = [];
};

api.interceptors.response.use(
(response) => response,

async (error) => {
const originalRequest = error.config;
const status = error.response?.status;
const requestUrl = originalRequest?.url || "";

// Don't refresh tokens for login, registration, or refresh failures.
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

const {
  refreshToken,
  setAccessToken,
  logout,
} = useAuthStore.getState();

if (!refreshToken) {
  logout();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }

  return Promise.reject(error);
}

if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  })
    .then((newAccessToken) => {
      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    })
    .catch((refreshError) => Promise.reject(refreshError));
}

originalRequest._retry = true;
isRefreshing = true;

try {
  const response = await api.post("/auth/refresh", {
    refreshToken,
  });

  const newAccessToken = response.data.accessToken;

  if (!newAccessToken) {
    throw new Error("Refresh response did not contain an access token");
  }

  setAccessToken(newAccessToken);

  processQueue(null, newAccessToken);

  originalRequest.headers =
    originalRequest.headers || {};

  originalRequest.headers.Authorization =
    `Bearer ${newAccessToken}`;

  // Retry the request that originally failed.
  return api(originalRequest);
} catch (refreshError) {
  processQueue(refreshError, null);

  logout();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }

  return Promise.reject(refreshError);
} finally {
  isRefreshing = false;
}


}
);

export default api;
