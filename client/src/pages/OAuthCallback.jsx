import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useAuthStore from "../store/authStore";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userParam = searchParams.get("user");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      if (oauthError === "github_denied") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError("GitHub authorization was cancelled.");
      } else if (oauthError === "account_exists") {
        setError(
          "An account with this email already exists. Please sign in with your password."
        );
      } else if (oauthError === "no_verified_email") {
        setError(
          "Your GitHub account does not have a verified email address."
        );
      } else {
        setError(
          "GitHub authentication failed. Please try again."
        );
      }

      return;
    }
    if (!accessToken || !refreshToken || !userParam) {
      setError("Authentication failed. Please try again.");
      return;
    }

    try {
      const user = JSON.parse(userParam);

      setAuth(user, accessToken, refreshToken);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("OAuth callback parsing error:", error);

      setError(
        "Unable to complete authentication. Please try again."
      );
    }
  }, [searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-white">
            Authentication failed
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 rounded-lg bg-[#d99558] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e2a66d]"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#29292d] border-t-[#d99558]" />

        <p className="mt-4 text-sm text-gray-500">
          Signing you in...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;