import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const RegisterForm = ({ onSwitch }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-7">
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
          Create your account
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Start building in a shared workspace in under a minute.
        </p>
      </div>

      <form className="space-y-4">
        {/* Username */}
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Username
          </label>

          <input
            type="text"
            placeholder="tishu_dev"
            className="h-10 w-full rounded-lg border border-[#29292d] bg-[#151518] px-4 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-[#d99558]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Email
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            className="h-10 w-full rounded-lg border border-[#29292d] bg-[#151518] px-4 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-[#d99558]"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="h-10 w-full rounded-lg border border-[#29292d] bg-[#151518] px-4 pr-12 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-[#d99558]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
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

          <p className="mt-1 text-[11px] text-gray-600">
            Use 8+ characters with a number and symbol
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Confirm password
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
              className="h-10 w-full rounded-lg border border-[#29292d] bg-[#151518] px-4 pr-12 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-[#d99558]"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Create Account */}
        <button
          type="submit"
          className="h-10 w-full rounded-lg bg-[#d99558] text-sm font-semibold text-black transition hover:bg-[#e2a66d] active:scale-[0.99]"
        >
          Create Account
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
        className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#29292d] text-sm font-medium text-gray-300 transition hover:bg-[#151518]"
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
          className="font-medium text-[#d99558] hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;