import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const LoginForm = ({ onSwitch }) => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/");
  };

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

      <form className="space-y-5">
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
              placeholder="••••••••"
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
        </div>

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#29292d] bg-[#151518] accent-[#d99558]"
          />

          Remember me
        </label>

        {/* Sign In */}
        <button
          type="submit"
          className="h-10 w-full rounded-lg bg-[#d99558] text-sm font-semibold text-black transition hover:bg-[#e2a66d] active:scale-[0.99]"
        >
          Sign In
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
        className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#29292d] text-sm font-medium text-gray-300 transition hover:bg-[#151518]"
      >
        <span className="font-bold text-red-500">G</span>
        Continue with Google
      </button>

      {/* Register */}
      <p className="mt-7 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-[#d99558] hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;