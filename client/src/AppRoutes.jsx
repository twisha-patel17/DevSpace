import { Routes, Route } from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OAuthCallback from "./pages/OAuthCallback";
import DashboardPage from "./pages/DashboardPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import SharedWithMePage from "./pages/SharedWithMePage";
import RecentPage from "./pages/RecentPage";

import AppLayout from "./components/layout/AppLayout";

const AppRoutes = () => {
  return (
    <Routes>
      
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/oauth/callback"
        element={<OAuthCallback />}
      />

      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/workspaces"
          element={<WorkspacesPage />}
        />

        <Route
          path="/shared"
          element={<SharedWithMePage />}
        />

        <Route
          path="/recent"
          element={<RecentPage />}
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;