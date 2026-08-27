import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { loginUser } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";

const LoginForm = ({ onSwitch }) => {
  const navigate = useNavigate();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      console.log("Login successful:", data);

      // Adjust these names if your backend response uses different names
      setAuth(data.user, data.accessToken);

      navigate("/dashboard");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Unable to sign in. Please check your credentials.";

      setErrors({
        server: message,
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name] || errors.server) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        server: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    loginMutation.mutate({
      email: formData.email.trim(),
      password: formData.password,
      rememberMe,
    });
  };

  const handleCancel = () => {
    navigate("/");
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-gray-500 transition-colors hover:text-gray-200"
          >
            Cancel
          </button>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Sign in to keep building where you left off.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm text-gray-400"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            className={`h-10 w-full rounded-lg border bg-[#151518] px-4 text-sm text-white outline-none placeholder:text-gray-600 transition ${
              errors.email
                ? "border-red-500/60 focus:border-red-500"
                : "border-[#29292d] focus:border-[#d99558]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          />

          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm text-gray-400"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              className={`h-10 w-full rounded-lg border bg-[#151518] px-4 pr-12 text-sm text-white outline-none placeholder:text-gray-600 transition ${
                errors.password
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-[#29292d] focus:border-[#d99558]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        {/* Server Error */}
        {errors.server && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <p className="text-sm text-red-400">
              {errors.server}
            </p>
          </div>
        )}

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) =>
              setRememberMe(e.target.checked)
            }
            disabled={isLoading}
            className="h-4 w-4 rounded border-[#29292d] bg-[#151518] accent-[#d99558]"
          />

          Remember me
        </label>

        {/* Sign In */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-10 w-full items-center justify-center rounded-lg bg-[#d99558] text-sm font-semibold text-black transition hover:bg-[#e2a66d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#222225]" />

        <span className="text-xs text-gray-600">
          OR
        </span>

        <div className="h-px flex-1 bg-[#222225]" />
      </div>

      {/* Google */}
      <button
        type="button"
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#29292d] text-sm font-medium text-gray-300 transition hover:bg-[#151518] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="font-bold text-red-500">G</span>
        Continue with Google
      </button>

      <p className="mt-7 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          disabled={isLoading}
          className="font-medium text-[#d99558] hover:underline disabled:cursor-not-allowed"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;