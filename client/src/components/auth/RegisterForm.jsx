import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { registerUser } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";

const RegisterForm = ({ onSwitch }) => {
  const navigate = useNavigate();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});

  const passwordRegex =
    /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      console.log("Registration successful:", data);

      setAuth(data.user, data.accessToken);

      navigate("/dashboard");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Unable to create your account. Please try again.";

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

    // Username
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username =
        "Username must be at least 3 characters";
    } else if (formData.username.trim().length > 30) {
      newErrors.username =
        "Username cannot exceed 30 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be 8+ characters with a number and symbol";
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
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

    registerMutation.mutate({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });
  };

  const handleCancel = () => {
    navigate("/");
  };

  const isLoading = registerMutation.isPending;

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-7">
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-sm text-gray-500 transition-colors hover:text-gray-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Start building in a shared workspace in under a minute.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm text-gray-400"
          >
            Username
          </label>

          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="tishu_dev"
            autoComplete="username"
            disabled={isLoading}
            className={`h-10 w-full rounded-lg border bg-[#151518] px-4 text-sm text-white outline-none placeholder:text-gray-600 transition ${
              errors.username
                ? "border-red-500/60 focus:border-red-500"
                : "border-[#29292d] focus:border-[#d99558]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          />

          {errors.username && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.username}
            </p>
          )}
        </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
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
              disabled={isLoading}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {errors.password ? (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.password}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-600">
              Use 8+ characters with a number and symbol
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm text-gray-400"
          >
            Confirm password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={
                showConfirmPassword ? "text" : "password"
              }
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              disabled={isLoading}
              className={`h-10 w-full rounded-lg border bg-[#151518] px-4 pr-12 text-sm text-white outline-none placeholder:text-gray-600 transition ${
                errors.confirmPassword
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-[#29292d] focus:border-[#d99558]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              disabled={isLoading}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed"
            >
              {showConfirmPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.confirmPassword}
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

        {/* Create Account */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-10 w-full items-center justify-center rounded-lg bg-[#d99558] text-sm font-semibold text-black transition hover:bg-[#e2a66d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Creating account..."
            : "Create Account"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
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

      {/* Login */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          disabled={isLoading}
          className="font-medium text-[#d99558] hover:underline disabled:cursor-not-allowed"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;