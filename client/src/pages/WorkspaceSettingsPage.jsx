
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  Code2,
  Trash2,
  Save,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Globe,
  ChevronRight,
  X,
} from "lucide-react";
import api from "../api/axios";

const sections = [
  {
    id: "general",
    label: "General",
    description: "Workspace details",
    icon: Settings,
  },
  {
    id: "access",
    label: "Access & visibility",
    description: "Privacy and access",
    icon: ShieldCheck,
  },
  {
    id: "members",
    label: "Members",
    description: "People and permissions",
    icon: Users,
  },
  {
    id: "editor",
    label: "Editor preferences",
    description: "Customize your editor",
    icon: Code2,
  },
  {
    id: "danger",
    label: "Danger zone",
    description: "Irreversible actions",
    icon: Trash2,
  },
];

const initialPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  minimap: true,
  lineNumbers: true,
};

const inputClass =
  "w-full rounded-xl border border-white/[0.09] bg-[#111113] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10";

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-[#18181b]";

function SettingLabel({ children, description }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-zinc-200">{children}</p>
      {description && (
        <p className="text-xs leading-5 text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-7 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("general");
  const [workspace, setWorkspace] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    language: "Blank",
    visibility: "private",
  });
  const [preferences, setPreferences] = useState(initialPreferences);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/workspaces/${workspaceId}`);

        if (cancelled) return;

        const data =
          response.data?.workspace ??
          response.data?.data ??
          response.data;

        const currentWorkspace = data?.workspace ?? data;

        if (!currentWorkspace || !currentWorkspace._id) {
          throw new Error(
            "The workspace response did not contain a workspace."
          );
        }

        setWorkspace(currentWorkspace);
        setForm({
          name: currentWorkspace.name ?? "",
          description: currentWorkspace.description ?? "",
          language: currentWorkspace.language ?? "Blank",
          visibility: currentWorkspace.visibility ?? "private",
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load workspace settings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        `devspace-editor-preferences-${workspaceId}`
      );

      if (stored) {
        setPreferences({
          ...initialPreferences,
          ...JSON.parse(stored),
        });
      }
    } catch {
      // Keep the default editor preferences if stored data is invalid.
    }
  }, [workspaceId]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const updatePreference = (field, value) => {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const isOwner = Boolean(
    workspace?.role === "owner" ||
      workspace?.isOwner ||
      workspace?.owner?._id === workspace?.currentUserId
  );

  const members = [
    ...(workspace?.owner
      ? [
          {
            ...workspace.owner,
            role: "owner",
            _id: workspace.owner._id,
          },
        ]
      : []),
    ...(Array.isArray(workspace?.members)
      ? workspace.members.map((member) => ({
          ...(member.user ?? member),
          role: member.role ?? "editor",
        }))
      : []),
  ].filter(
    (member, index, array) =>
      member._id &&
      array.findIndex((item) => item._id === member._id) === index
  );

  async function saveWorkspace() {
    if (!form.name.trim()) {
      setError("Workspace name cannot be empty.");
      setActiveSection("general");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.patch(`/workspaces/${workspaceId}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        language: form.language,
        visibility: form.visibility,
      });

      setWorkspace((current) => ({
        ...current,
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      }));

      setNotice("Workspace settings saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save workspace settings. Check that the update API exists."
      );
    } finally {
      setSaving(false);
    }
  }

  function saveEditorPreferences() {
    try {
      localStorage.setItem(
        `devspace-editor-preferences-${workspaceId}`,
        JSON.stringify(preferences)
      );

      setNotice(
        "Editor preferences saved in this browser for this workspace."
      );
      setError("");
    } catch {
      setError("Unable to save editor preferences in this browser.");
    }
  }

  async function deleteWorkspace() {
    if (deleteConfirmation !== workspace?.name) return;

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/workspaces/${workspaceId}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete this workspace. Check the delete API and your permissions."
      );
      setDeleting(false);
    }
  }

  const active = sections.find(
    (section) => section.id === activeSection
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101012] text-zinc-400">
        <div className="flex items-center gap-3 text-sm">
          <LoaderCircle className="animate-spin" size={19} />
          Loading workspace settings...
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101012] px-5">
        <div className={`${cardClass} max-w-md p-7 text-center`}>
          <AlertCircle
            size={32}
            className="mx-auto mb-4 text-red-400"
          />
          <h1 className="text-lg font-semibold text-white">
            Unable to load settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {error}
          </p>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}`)}
            className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101012] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#101012]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() =>
                navigate(`/workspaces/${workspaceId}`)
              }
              title="Back to editor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ArrowLeft size={17} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {workspace?.name || "Workspace"}
                </span>
                <ChevronRight
                  size={13}
                  className="shrink-0 text-zinc-600"
                />
                <span className="shrink-0 text-sm text-zinc-400">
                  Settings
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-600">
                Workspace configuration
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-500">
              {workspace?.visibility || "private"}
            </span>
            <button
              onClick={() =>
                navigate(`/workspaces/${workspaceId}`)
              }
              className="rounded-xl border border-white/[0.09] px-3.5 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
            >
              Open editor
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-9 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <SlidersHorizontal size={17} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Workspace controls
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Workspace settings
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-base">
            Manage how this workspace works, who can access it,
            and how the coding environment behaves.
          </p>
        </div>

        {(error || notice) && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-500/20 bg-red-500/[0.06] text-red-300"
                : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
            }`}
          >
            {error ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}
            <span>{error || notice}</span>
            <button
              onClick={() => {
                setError("");
                setNotice("");
              }}
              className="ml-auto shrink-0 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-24">
            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setError("");
                      setNotice("");
                    }}
                    className={`flex min-w-max items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition lg:w-full ${
                      selected
                        ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                        : "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.025] hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {section.label}
                      </span>
                      <span
                        className={`mt-1 hidden text-xs lg:block ${
                          selected
                            ? "text-emerald-300/60"
                            : "text-zinc-600"
                        }`}
                      >
                        {section.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-7 hidden rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 lg:block">
              <div className="flex items-center gap-2 text-zinc-400">
                <LockKeyhole size={15} />
                <span className="text-xs font-medium">
                  Workspace-specific
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                These options apply to this workspace, not your
                entire DevSpace account.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            {activeSection === "general" && (
              <section>
                <SectionHeading
                  eyebrow="Workspace"
                  title="General settings"
                  description="Update the identity and default configuration of your collaborative coding workspace."
                />

                <div className={`${cardClass} divide-y divide-white/[0.06]`}>
                  <div className="space-y-2 p-5 sm:p-6">
                    <SettingLabel description="Give your workspace a recognizable name.">
                      Workspace name
                    </SettingLabel>
                    <input
                      className={inputClass}
                      value={form.name}
                      maxLength={80}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      placeholder="My workspace"
                      disabled={!isOwner}
                    />
                    <p className="text-right text-xs text-zinc-600">
                      {form.name.length}/80
                    </p>
                  </div>

                  <div className="space-y-2 p-5 sm:p-6">
                    <SettingLabel description="Tell collaborators what this workspace is for.">
                      Description
                    </SettingLabel>
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={form.description}
                      maxLength={500}
                      onChange={(event) =>
                        updateForm(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="What are you building together?"
                      disabled={!isOwner}
                    />
                    <p className="text-right text-xs text-zinc-600">
                      {form.description.length}/500
                    </p>
                  </div>

                  <div className="space-y-2 p-5 sm:p-6">
                    <SettingLabel description="Choose the default language for new workspace files.">
                      Default language
                    </SettingLabel>
                    <select
                      className={inputClass}
                      value={form.language}
                      onChange={(event) =>
                        updateForm("language", event.target.value)
                      }
                      disabled={!isOwner}
                    >
                      <option value="Blank">Blank / choose per file</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Python">Python</option>
                      <option value="C++">C++</option>
                      <option value="Java">Java</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <p className="text-sm text-zinc-400">
                        Changes apply to this workspace.
                      </p>
                      {!isOwner && (
                        <p className="mt-1 text-xs text-amber-400">
                          Only the workspace owner can edit these details.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={saveWorkspace}
                      disabled={saving || !isOwner}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#07130e] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "access" && (
              <section>
                <SectionHeading
                  eyebrow="Security"
                  title="Access & visibility"
                  description="Control how this workspace is shared and who should be able to access it."
                />

                <div className={`${cardClass} divide-y divide-white/[0.06]`}>
                  <div className="p-5 sm:p-6">
                    <SettingLabel description="Choose the visibility setting for this workspace.">
                      Workspace visibility
                    </SettingLabel>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "private",
                          label: "Private",
                          description:
                            "Restrict access to the owner and invited members.",
                          icon: LockKeyhole,
                        },
                        {
                          value: "public",
                          label: "Public",
                          description:
                            "Make the workspace available according to your app's public-access rules.",
                          icon: Globe,
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        const selected =
                          form.visibility === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={!isOwner}
                            onClick={() =>
                              updateForm(
                                "visibility",
                                option.value
                              )
                            }
                            className={`rounded-xl border p-4 text-left transition ${
                              selected
                                ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                                : "border-white/[0.08] hover:border-white/[0.16]"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon
                                size={20}
                                className={
                                  selected
                                    ? "text-emerald-400"
                                    : "text-zinc-400"
                                }
                              />
                              <span
                                className={`h-4 w-4 rounded-full border ${
                                  selected
                                    ? "border-emerald-400 bg-emerald-400 ring-2 ring-emerald-400/20"
                                    : "border-zinc-600"
                                }`}
                              />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-white">
                              {option.label}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-zinc-500">
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-xs leading-5 text-amber-400/80">
                      Public visibility should only be enabled after
                      confirming that your backend enforces the intended
                      access rules.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <p className="text-xs text-zinc-500">
                      Visibility changes require owner permissions.
                    </p>
                    <button
                      onClick={saveWorkspace}
                      disabled={saving || !isOwner}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#07130e] hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <Save size={16} />
                      Save visibility
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "members" && (
              <section>
                <SectionHeading
                  eyebrow="Collaboration"
                  title="Members & permissions"
                  description="Review the people associated with this workspace and their access levels."
                />

                <div className={`${cardClass} overflow-hidden`}>
                  <div className="flex items-center justify-between border-b border-white/[0.06] p-5 sm:p-6">
                    <div>
                      <p className="font-medium text-white">
                        Workspace members
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {members.length}{" "}
                        {members.length === 1 ? "member" : "members"} listed
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                      <Users size={19} />
                    </div>
                  </div>

                  {members.length > 0 ? (
                    <div className="divide-y divide-white/[0.05]">
                      {members.map((member) => {
                        const name =
                          member.username ||
                          member.name ||
                          member.email ||
                          "Workspace member";

                        return (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 px-5 py-4 sm:px-6"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-emerald-500/10 text-sm font-semibold text-emerald-300">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-200">
                                {name}
                              </p>
                              {member.email && (
                                <p className="mt-1 truncate text-xs text-zinc-500">
                                  {member.email}
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs capitalize ${
                                member.role === "owner"
                                  ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
                                  : "border-white/[0.08] text-zinc-400"
                              }`}
                            >
                              {member.role || "member"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Users
                        size={26}
                        className="mx-auto text-zinc-600"
                      />
                      <p className="mt-3 text-sm text-zinc-400">
                        Member details aren't available in the workspace
                        response.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Check that the workspace endpoint populates its
                        owner and members.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-white/[0.06] p-5 sm:p-6">
                    <button
                      onClick={() =>
                        navigate(`/workspaces/${workspaceId}`)
                      }
                      className="inline-flex items-center gap-2 text-sm text-emerald-400 transition hover:text-emerald-300"
                    >
                      Manage collaborators in the workspace
                      <ChevronRight size={16} />
                    </button>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      Role changes and invitations should use the existing
                      membership APIs and server-side permission checks.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "editor" && (
              <section>
                <SectionHeading
                  eyebrow="Developer experience"
                  title="Editor preferences"
                  description="Customize the Monaco editor for this workspace. These preferences are stored locally in this browser."
                />

                <div className={`${cardClass} divide-y divide-white/[0.06]`}>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-5">
                      <SettingLabel description="Adjust the code editor text size.">
                        Font size
                      </SettingLabel>
                      <span className="rounded-lg border border-white/[0.08] px-3 py-1.5 font-mono text-sm text-emerald-300">
                        {preferences.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      step="1"
                      value={preferences.fontSize}
                      onChange={(event) =>
                        updatePreference(
                          "fontSize",
                          Number(event.target.value)
                        )
                      }
                      className="mt-5 w-full accent-emerald-500"
                    />
                    <div className="mt-2 flex justify-between text-xs text-zinc-600">
                      <span>10px</span>
                      <span>24px</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 p-5 sm:p-6">
                    <SettingLabel description="Number of spaces inserted by a tab.">
                      Tab size
                    </SettingLabel>
                    <select
                      value={preferences.tabSize}
                      onChange={(event) =>
                        updatePreference(
                          "tabSize",
                          Number(event.target.value)
                        )
                      }
                      className="rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                      <option value={8}>8 spaces</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-5 p-5 sm:p-6">
                    <SettingLabel description="Wrap long lines or allow horizontal scrolling.">
                      Word wrap
                    </SettingLabel>
                    <select
                      value={preferences.wordWrap}
                      onChange={(event) =>
                        updatePreference(
                          "wordWrap",
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/40"
                    >
                      <option value="on">Enabled</option>
                      <option value="off">Disabled</option>
                    </select>
                  </div>

                  {[
                    {
                      key: "minimap",
                      label: "Minimap",
                      description:
                        "Show a code overview on the side of the editor.",
                    },
                    {
                      key: "lineNumbers",
                      label: "Line numbers",
                      description:
                        "Display line numbers beside your code.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-5 p-5 sm:p-6"
                    >
                      <SettingLabel description={item.description}>
                        {item.label}
                      </SettingLabel>
                      <Toggle
                        checked={preferences[item.key]}
                        onChange={(checked) =>
                          updatePreference(item.key, checked)
                        }
                      />
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <p className="text-xs text-zinc-500">
                      Preferences are saved separately for this workspace.
                    </p>
                    <button
                      onClick={saveEditorPreferences}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#07130e] transition hover:bg-emerald-400"
                    >
                      <Save size={16} />
                      Save preferences
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "danger" && (
              <section>
                <SectionHeading
                  eyebrow="Irreversible actions"
                  title="Danger zone"
                  description="Actions here can permanently affect this workspace and its collaborators."
                />

                <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-[#18181b]">
                  <div className="flex items-start gap-4 p-5 sm:p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.07] text-red-400">
                      <Trash2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">
                        Delete workspace
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Permanently remove this workspace. Depending on
                        your backend's deletion behavior, its files and
                        collaboration data may also be deleted.
                      </p>

                      {!isOwner && (
                        <p className="mt-3 text-xs text-amber-400">
                          Only the workspace owner should be allowed to
                          perform this action.
                        </p>
                      )}

                      <button
                        onClick={() => {
                          setDeleteConfirmation("");
                          setShowDeleteModal(true);
                        }}
                        disabled={!isOwner}
                        className="mt-5 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete this workspace
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
              <span className="text-xs text-zinc-600">
                {active?.label || "Workspace settings"}
              </span>
              <button
                onClick={() =>
                  navigate(`/workspaces/${workspaceId}`)
                }
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                Back to editor
              </button>
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workspace-title"
            className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#18181b] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/[0.08] text-red-400">
                <Trash2 size={20} />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <h2
              id="delete-workspace-title"
              className="text-xl font-semibold text-white"
            >
              Delete this workspace?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This action cannot be undone. To confirm, type the workspace
              name exactly as shown below.
            </p>

            <div className="my-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 font-mono text-sm text-zinc-200">
              {workspace?.name}
            </div>

            <input
              autoFocus
              value={deleteConfirmation}
              onChange={(event) =>
                setDeleteConfirmation(event.target.value)
              }
              placeholder="Enter workspace name"
              className={inputClass}
              disabled={deleting}
            />

            {error && (
              <p className="mt-3 text-sm text-red-300">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/[0.09] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteWorkspace}
                disabled={
                  deleting ||
                  deleteConfirmation !== workspace?.name ||
                  !isOwner
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {deleting ? "Deleting..." : "Delete workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
