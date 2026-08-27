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

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username =
        "Username must be at least 3 characters";
    } else if (formData.username.trim().length > 30) {
      newErrors.username =
        "Username must be at most 30 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    } else if (formData.password.length > 100) {
      newErrors.password = "Password is too long";
    }

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

  const handleGithubRegister = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL
    }/api/auth/github`;
  };

  const isLoading = registerMutation.isPending;

  return (
    <div className="w-full max-w-md">
    
      <div className="mb-8">
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
          Start building and collaborating with your team.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
      
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
            placeholder="yourusername"
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

          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm text-gray-400"
          >
            Confirm Password
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
              placeholder="••••••••"
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

        {errors.server && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <p className="text-sm text-red-400">
              {errors.server}
            </p>
          </div>
        )}

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

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#222225]" />

        <span className="text-xs text-gray-600">
          OR
        </span>

        <div className="h-px flex-1 bg-[#222225]" />
      </div>

      <button
        type="button"
        onClick={handleGithubRegister}
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#29292d] text-sm font-medium text-gray-300 transition hover:bg-[#151518] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-current"
          aria-hidden="true"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22 0 0-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.21 0 1.595-.015 2.875-.015 3.265 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12Z" />
        </svg>

        Continue with GitHub
      </button>

      <p className="mt-7 text-center text-sm text-gray-500">
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