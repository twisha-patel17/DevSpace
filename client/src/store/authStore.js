import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken = null) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setAccessToken: (accessToken) => {
        set({
          accessToken,
          isAuthenticated: !!accessToken,
        });
      },

      setRefreshToken: (refreshToken) => {
        set({
          refreshToken,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("devspace-auth");
      },
    }),
    {
      name: "devspace-auth",
    }
  )
);

export default useAuthStore;