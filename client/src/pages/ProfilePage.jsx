
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  CalendarDays,
  ShieldCheck,
  Pencil,
  Check,
  X,
  LoaderCircle,
  Camera,
  Github,
  LockKeyhole,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  getCurrentUser,
  updateUserProfile,
} from "../api/user.api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCurrentUser();
      const profile = response.user;

      setUser(profile);
      setUsername(profile.username || "");
      setAvatar(profile.avatar || "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setUsername(user.username || "");
    setAvatar(user.avatar || "");
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    setUsername(user.username || "");
    setAvatar(user.avatar || "");
    setError("");
    setEditing(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      setError("Username must contain at least 3 characters.");
      return;
    }

    if (trimmedUsername.length > 30) {
      setError("Username cannot exceed 30 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateUserProfile({
        username: trimmedUsername,
        avatar: avatar.trim(),
      });

      setUser(response.user);
      setUsername(response.user.username || "");
      setAvatar(response.user.avatar || "");
      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitial = (name) => {
    return name?.trim()?.charAt(0)?.toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#96918b]">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#dc9458]" />
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-white/[0.08] bg-[#101214] p-6">
          <AlertCircle className="mb-3 h-6 w-6 text-red-400" />
          <h2 className="text-lg font-semibold text-[#f2eee9]">
            Couldn't load your profile
          </h2>
          <p className="mt-2 text-sm text-[#96918b]">
            {error || "Something went wrong while loading your account."}
          </p>

          <button
            onClick={fetchProfile}
            className="mt-5 rounded-lg bg-[#dc9458] px-4 py-2 text-sm font-medium text-[#17120e] transition hover:bg-[#e7a66e]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
      {/* Page heading */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#dc9458]">
          Your account
        </p>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f2eee9] sm:text-4xl">
              Profile
            </h1>
            <p className="mt-2 text-sm text-[#96918b]">
              Manage your personal information and account details.
            </p>
          </div>

          {!editing && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/[0.1] bg-[#17191b] px-4 py-2.5 text-sm font-medium text-[#e9e2da] transition hover:border-[#dc9458]/40 hover:bg-[#1d1d1c]"
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.5fr]">
        {/* Profile summary */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101214]">
          <div className="h-24 bg-gradient-to-r from-[#3c2a1e] via-[#68452e] to-[#24201c]" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#101214] bg-[#25201c] text-3xl font-semibold text-[#e9b17e]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.username}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                getInitial(user.username)
              )}
            </div>

            <h2 className="mt-5 break-words text-xl font-semibold text-[#f2eee9]">
              {user.username}
            </h2>

            <p className="mt-1 break-all text-sm text-[#96918b]">
              {user.email}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dc9458]/20 bg-[#dc9458]/[0.08] px-3 py-1.5 text-xs font-medium text-[#e9b17e]">
                <ShieldCheck className="h-3.5 w-3.5" />
                DevSpace account
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[#b0aaa3]">
                {user.authProvider === "github" ? (
                  <Github className="h-3.5 w-3.5" />
                ) : (
                  <LockKeyhole className="h-3.5 w-3.5" />
                )}
                {user.authProvider === "github"
                  ? "GitHub login"
                  : "Email & password"}
              </span>
            </div>

            <div className="mt-6 border-t border-white/[0.07] pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                  <CalendarDays className="h-4 w-4 text-[#dc9458]" />
                </div>

                <div>
                  <p className="text-xs text-[#77736e]">Member since</p>
                  <p className="mt-1 text-sm text-[#e9e2da]">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile information */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#101214] p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#f2eee9]">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-[#96918b]">
              Your profile details and account identity.
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-2 block text-sm font-medium text-[#c9c2ba]"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736e]" />

                  <input
                    id="profile-username"
                    type="text"
                    minLength={3}
                    maxLength={30}
                    required
                    disabled={!editing || saving}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0b0d0f] py-3 pl-10 pr-4 text-sm text-[#f2eee9] outline-none transition placeholder:text-[#625e59] focus:border-[#dc9458]/60 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="Your username"
                  />
                </div>

                <p className="mt-2 text-xs text-[#77736e]">
                  Between 3 and 30 characters.
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-[#c9c2ba]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736e]" />

                  <input
                    id="profile-email"
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-[#96918b] outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-[#77736e]">
                  Email changes are not available here.
                </p>
              </div>

              {/* Avatar */}
              <div>
                <label
                  htmlFor="profile-avatar"
                  className="mb-2 block text-sm font-medium text-[#c9c2ba]"
                >
                  Avatar image URL
                </label>

                <div className="relative">
                  <Camera className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736e]" />

                  <input
                    id="profile-avatar"
                    type="url"
                    value={avatar}
                    disabled={!editing || saving}
                    onChange={(event) => setAvatar(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0b0d0f] py-3 pl-10 pr-4 text-sm text-[#f2eee9] outline-none transition placeholder:text-[#625e59] focus:border-[#dc9458]/60 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                <p className="mt-2 text-xs text-[#77736e]">
                  Enter a direct image URL, or leave it blank to use your initial.
                </p>
              </div>

              {/* Authentication provider */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#c9c2ba]">
                  Sign-in method
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  {user.authProvider === "github" ? (
                    <Github className="h-5 w-5 text-[#c9c2ba]" />
                  ) : (
                    <LockKeyhole className="h-5 w-5 text-[#c9c2ba]" />
                  )}

                  <div>
                    <p className="text-sm text-[#e9e2da]">
                      {user.authProvider === "github"
                        ? "GitHub"
                        : "Email and password"}
                    </p>
                    <p className="mt-1 text-xs text-[#77736e]">
                      Managed by your authentication provider.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {editing && (
              <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-white/[0.07] pt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-[#c9c2ba] transition hover:bg-white/[0.04] disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#dc9458] px-4 py-2.5 text-sm font-semibold text-[#17120e] transition hover:bg-[#e7a66e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;