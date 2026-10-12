
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Code2,
  FileCode2,
  FolderCode,
  FolderKanban,
  Globe2,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";

import CreateWorkspaceModal from "../components/CreateWorkspaceModal";

import {
  useWorkspaces,
  useCreateWorkspace,
  useDeleteWorkspace,
} from "../lib/workspace.queries";

/* =========================================================
   HELPERS
========================================================= */

const getName = (workspace) =>
  workspace?.name || workspace?.title || "Untitled workspace";

const getLanguage = (language) => {
  const value = String(language || "").trim().toLowerCase();

  const languages = {
    javascript: {
      name: "JavaScript",
      short: "JS",
      color: "#e5c82d",
      bg: "#302f1c",
    },
    js: {
      name: "JavaScript",
      short: "JS",
      color: "#e5c82d",
      bg: "#302f1c",
    },
    typescript: {
      name: "TypeScript",
      short: "TS",
      color: "#72a4e2",
      bg: "#1c2638",
    },
    ts: {
      name: "TypeScript",
      short: "TS",
      color: "#72a4e2",
      bg: "#1c2638",
    },
    python: {
      name: "Python",
      short: "PY",
      color: "#65bc8d",
      bg: "#1c3029",
    },
    java: {
      name: "Java",
      short: "JV",
      color: "#df9758",
      bg: "#30231d",
    },
    "c++": {
      name: "C++",
      short: "C++",
      color: "#72a4e2",
      bg: "#1c2638",
    },
    cpp: {
      name: "C++",
      short: "C++",
      color: "#72a4e2",
      bg: "#1c2638",
    },
    c: {
      name: "C",
      short: "C",
      color: "#72a4e2",
      bg: "#1c2638",
    },
    go: {
      name: "Go",
      short: "GO",
      color: "#66c7d4",
      bg: "#1d2d31",
    },
    rust: {
      name: "Rust",
      short: "RS",
      color: "#d99a67",
      bg: "#30251e",
    },
  };

  return (
    languages[value] || {
      name: language || "Blank",
      short: String(language || "BL").slice(0, 3).toUpperCase(),
      color: "#a1a1aa",
      bg: "#242528",
    }
  );
};

const getRole = (workspace) =>
  workspace?.role || workspace?.memberRole || "owner";

const getMembers = (workspace) =>
  Array.isArray(workspace?.members) ? workspace.members : [];

const getMemberCount = (workspace) => getMembers(workspace).length;

const getTimestamp = (workspace) => {
  const date =
    workspace?.updatedAt ||
    workspace?.lastOpenedAt ||
    workspace?.createdAt;

  if (!date) return 0;

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getRelativeTime = (date) => {
  if (!date) return "Date unavailable";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Date unavailable";

  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);

  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
};

const getVisibility = (workspace) =>
  String(workspace?.visibility || "private").toLowerCase();

const getUniqueCollaboratorCount = (workspaces) => {
  const ids = new Set();

  workspaces.forEach((workspace) => {
    getMembers(workspace).forEach((member) => {
      const user = member?.user || member;
      const id = user?._id || user?.id;

      if (id) ids.add(String(id));
    });
  });

  return ids.size;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#dc9458]">
          {eyebrow}
        </p>
      )}

      <h2 className="text-[17px] font-semibold tracking-[-0.035em] text-[#ededee]">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-[11px] text-zinc-600">{description}</p>
      )}
    </div>

    {action}
  </div>
);

const LanguageIcon = ({ language, size = "normal" }) => {
  const info = getLanguage(language);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-mono font-bold ${
        size === "large" ? "h-12 w-12 text-[12px]" : "h-10 w-10 text-[10px]"
      }`}
      style={{ color: info.color, backgroundColor: info.bg }}
    >
      {info.short}
    </div>
  );
};

const AvatarStack = ({ workspace }) => {
  const members = getMembers(workspace);

  const people = [];
  const owner = workspace?.owner || workspace?.createdBy;

  if (owner && typeof owner === "object") {
    people.push(owner);
  }

  members.forEach((member) => {
    const user = member?.user || member;

    if (!user || typeof user !== "object") return;

    const id = user._id || user.id || user.email;

    if (
      !id ||
      people.some(
        (person) =>
          String(person._id || person.id || person.email) === String(id)
      )
    ) {
      return;
    }

    people.push(user);
  });

  if (!people.length) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-600">
        <Users size={12} />
        <span className="text-[10px]">Just you</span>
      </div>
    );
  }

  const colors = ["#dc9458", "#73a8e9", "#a67adb", "#65bc8d"];

  return (
    <div className="flex items-center">
      {people.slice(0, 3).map((person, index) => {
        const label =
          person.username ||
          person.name ||
          person.email ||
          "User";

        const initials = label
          .split(/[\s@._-]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();

        const avatar = person.avatar || person.profilePicture;

        return (
          <div
            key={person._id || person.id || label}
            title={label}
            className={`flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-[#111214] text-[8px] font-bold ${
              index ? "-ml-1.5" : ""
            }`}
            style={{
              backgroundColor: colors[index % colors.length],
              color: "#111214",
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "?"
            )}
          </div>
        );
      })}

      {people.length > 3 && (
        <span className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#111214] bg-[#292a2d] text-[8px] text-zinc-300">
          +{people.length - 3}
        </span>
      )}

      <span className="ml-2 text-[10px] text-zinc-600">
        {people.length} {people.length === 1 ? "person" : "people"}
      </span>
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) => (
  <div className="group rounded-xl border border-white/[0.065] bg-[#111214] p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#141517] sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}15`, color: accent }}
      >
        <Icon size={17} strokeWidth={1.7} />
      </div>

      <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </span>
    </div>

    <p className="mt-4 text-[27px] font-semibold tracking-[-0.055em] text-[#ededee]">
      {value}
    </p>

    <p className="mt-1 text-[10px] text-zinc-600">{description}</p>
  </div>
);

/* =========================================================
   WORKSPACE CARD
========================================================= */

const WorkspaceCard = ({ workspace, onOpen, onDelete, deleting }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const name = getName(workspace);
  const language = getLanguage(workspace.language);
  const members = getMemberCount(workspace);
  const role = getRole(workspace);
  const visibility = getVisibility(workspace);

  const handleDelete = async () => {
    setMenuOpen(false);

    if (
      !window.confirm(
        `Delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    await onDelete(workspace);
  };

  return (
    <article
      className="group relative flex min-w-0 flex-col rounded-xl border border-white/[0.07] bg-[#111214] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#dc9458]/30 hover:bg-[#141517] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <LanguageIcon language={workspace.language} size="large" />

        <div className="relative">
          <button
            type="button"
            aria-label={`Options for ${name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close workspace menu"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setMenuOpen(false)}
              />

              <div className="absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-lg border border-white/[0.09] bg-[#1a1b1e] py-1 shadow-xl shadow-black/30">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpen(workspace);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                >
                  <ArrowUpRight size={13} />
                  Open workspace
                </button>

                {role === "owner" && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] text-red-400 hover:bg-red-500/[0.07] disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-200 transition-colors group-hover:text-white">
            {name}
          </h3>
        </div>

        <p className="mt-1.5 line-clamp-2 min-h-[30px] text-[10px] leading-[1.6] text-zinc-600">
          {workspace.description || "Ready for your next idea."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] text-zinc-400">
          {visibility === "public" ? (
            <Globe2 size={10} />
          ) : (
            <LockKeyhole size={10} />
          )}
          {visibility === "public" ? "Public" : "Private"}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] text-zinc-400">
          <Code2 size={10} />
          {language.name}
        </span>
      </div>

      <div className="mt-5 border-t border-white/[0.055] pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <AvatarStack workspace={workspace} />

          <span className="flex shrink-0 items-center gap-1 text-[9px] text-zinc-600">
            <Clock3 size={10} />
            {getRelativeTime(
              workspace.updatedAt ||
                workspace.lastOpenedAt ||
                workspace.createdAt
            )}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(workspace)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[10px] font-medium text-zinc-400 transition-all hover:border-[#dc9458]/30 hover:bg-[#dc9458]/[0.07] hover:text-[#e9a56f]"
      >
        Open editor
        <ArrowUpRight size={13} />
      </button>
    </article>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyWorkspaces = ({ onCreate }) => (
  <div className="flex min-h-[270px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#111214] px-5 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#dc9458]/15 bg-[#dc9458]/[0.08] text-[#dc9458]">
      <FolderCode size={22} strokeWidth={1.5} />
    </div>

    <h3 className="mt-4 text-[14px] font-semibold text-zinc-200">
      Your next project starts here
    </h3>

    <p className="mt-2 max-w-[300px] text-[11px] leading-5 text-zinc-600">
      Create a workspace, write code, and invite others to build with you.
    </p>

    <button
      type="button"
      onClick={onCreate}
      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#dc9458] px-4 py-2.5 text-[11px] font-semibold text-[#17110d] transition-colors hover:bg-[#eca267]"
    >
      <Plus size={14} />
      Create your first workspace
    </button>
  </div>
);

/* =========================================================
   DASHBOARD
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();

  const {
    data: workspaces = [],
    isLoading,
    isError,
    refetch,
  } = useWorkspaces();

  const createWorkspaceMutation = useCreateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedWorkspaces = useMemo(() => {
    return [...workspaces].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
  }, [workspaces]);

  const filteredWorkspaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return sortedWorkspaces;

    return sortedWorkspaces.filter((workspace) => {
      return [
        getName(workspace),
        workspace.description,
        workspace.language,
        workspace.visibility,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [searchQuery, sortedWorkspaces]);

  const stats = useMemo(() => {
    const owned = workspaces.filter(
      (workspace) => getRole(workspace) === "owner"
    ).length;

    const teamWorkspaces = workspaces.filter(
      (workspace) => getMemberCount(workspace) > 0
    ).length;

    const languages = new Set(
      workspaces
        .map((workspace) => getLanguage(workspace.language).name)
        .filter((language) => language !== "Blank")
    );

    return {
      total: workspaces.length,
      owned,
      teamWorkspaces,
      languages: languages.size,
      collaborators: getUniqueCollaboratorCount(workspaces),
    };
  }, [workspaces]);

  const featuredWorkspace = sortedWorkspaces[0] || null;

  const handleOpenWorkspace = (workspace) => {
    const id = workspace?._id || workspace?.id;

    if (!id) return;

    // Keep this path aligned with the workspace route in App.jsx.
    navigate(`/workspaces/${id}`);
  };

  const handleWorkspaceCreated = async (workspaceData) => {
    try {
      const result =
        await createWorkspaceMutation.mutateAsync(workspaceData);

      setShowCreateModal(false);

      // Accommodate common API response shapes.
      const workspace =
        result?.workspace ||
        result?.data?.workspace ||
        result?.data ||
        result;

      if (workspace?._id || workspace?.id) {
        navigate(`/workspaces/${workspace._id || workspace.id}`);
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  const handleDeleteWorkspace = async (workspace) => {
    const id = workspace?._id || workspace?.id;

    if (!id) return;

    try {
      await deleteWorkspaceMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0b] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dc9458]/25 border-t-[#dc9458]" />
          <span className="text-[12px]">Preparing your workspace...</span>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#090a0b] px-5 pb-12 pt-[100px] text-zinc-100 sm:px-8">
        <div className="mx-auto max-w-[1180px] rounded-xl border border-white/[0.08] bg-[#111214] p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/[0.08] text-red-400">
            <Zap size={18} />
          </div>

          <h2 className="mt-4 text-[15px] font-semibold">
            Couldn't load your dashboard
          </h2>

          <p className="mt-2 text-[11px] text-zinc-600">
            Check your connection and try loading your workspaces again.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-lg bg-[#dc9458] px-4 py-2.5 text-[11px] font-semibold text-[#17110d] hover:bg-[#eca267]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#090a0b] text-zinc-100">
        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-[94px] sm:px-6 lg:px-9">
          {/* WELCOME HEADER */}

          <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#111214]">
            <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full bg-[#dc9458]/[0.07] blur-[75px]" />

            <div className="pointer-events-none absolute right-8 top-8 hidden opacity-[0.055] md:block">
              <Code2 size={150} strokeWidth={0.8} />
            </div>

            <div className="relative flex flex-col justify-between gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:p-9">
              <div className="max-w-[600px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dc9458]/15 bg-[#dc9458]/[0.055] px-2.5 py-1.5">
                  <Sparkles size={11} className="text-[#dc9458]" />
                  <span className="text-[9px] font-medium tracking-wide text-[#d9a477]">
                    YOUR DEVELOPER COMMAND CENTER
                  </span>
                </div>

                <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.055em] text-[#f0f0f0] sm:text-[35px]">
                  Build something
                  <span className="text-[#dc9458]"> meaningful.</span>
                </h1>

                <p className="mt-3 max-w-[440px] text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                  Your projects, your code, your team. Everything you need to
                  turn an idea into something real.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#dc9458] px-4 py-3 text-[11px] font-semibold text-[#17110d] transition-all hover:bg-[#eca267] hover:shadow-lg hover:shadow-[#dc9458]/10"
                  >
                    <Plus size={15} />
                    New workspace
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/workspaces")}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
                  >
                    Explore projects
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <div className="relative grid grid-cols-2 gap-3 lg:w-[280px] lg:shrink-0">
                <div className="rounded-xl border border-white/[0.065] bg-[#17181a]/80 p-4">
                  <FolderKanban
                    size={17}
                    className="text-[#dc9458]"
                    strokeWidth={1.7}
                  />
                  <p className="mt-3 text-[25px] font-semibold tracking-tight text-zinc-100">
                    {stats.total.toString().padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[9px] text-zinc-600">
                    Total workspaces
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.065] bg-[#17181a]/80 p-4">
                  <Users
                    size={17}
                    className="text-[#73a8e9]"
                    strokeWidth={1.7}
                  />
                  <p className="mt-3 text-[25px] font-semibold tracking-tight text-zinc-100">
                    {stats.collaborators.toString().padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[9px] text-zinc-600">
                    Unique team members
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* OVERVIEW STATS */}

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-zinc-200">
                  Workspace overview
                </h2>
                <p className="mt-1 text-[10px] text-zinc-600">
                  A snapshot of your development space
                </p>
              </div>

              <span className="rounded-md border border-white/[0.06] px-2 py-1 text-[9px] text-zinc-600">
                LIVE DATA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                icon={FolderCode}
                label="ALL PROJECTS"
                value={stats.total}
                description="Workspaces available to you"
                accent="#dc9458"
              />

              <StatCard
                icon={Code2}
                label="LANGUAGES"
                value={stats.languages}
                description="Distinct configured languages"
                accent="#73a8e9"
              />

              <StatCard
                icon={Users}
                label="COLLABORATION"
                value={stats.teamWorkspaces}
                description="Workspaces with members"
                accent="#a67adb"
              />

              <StatCard
                icon={LockKeyhole}
                label="YOUR PROJECTS"
                value={stats.owned}
                description="Workspaces you own"
                accent="#65bc8d"
              />
            </div>
          </section>

          {/* CONTINUE CODING */}

          <section className="mb-11">
            <SectionHeading
              eyebrow="PICK UP WHERE YOU LEFT OFF"
              title="Continue coding"
              description="Jump straight back into your development environment."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/workspaces")}
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 transition-colors hover:text-[#dc9458]"
                >
                  All workspaces
                  <ArrowRight size={12} />
                </button>
              }
            />

            {featuredWorkspace ? (
              <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                {/* FEATURED WORKSPACE */}

                <button
                  type="button"
                  onClick={() => handleOpenWorkspace(featuredWorkspace)}
                  className="group relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-xl border border-[#dc9458]/20 bg-[#141311] p-5 text-left transition-all hover:border-[#dc9458]/40 sm:p-6"
                >
                  <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-[#dc9458]/[0.08] blur-[55px]" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <LanguageIcon
                        language={featuredWorkspace.language}
                        size="large"
                      />

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.13em] text-[#dc9458]">
                          {getTimestamp(featuredWorkspace)
                            ? "LATEST ACTIVITY"
                            : "YOUR WORKSPACE"}
                        </p>
                        <p className="mt-1 max-w-[240px] truncate text-[14px] font-semibold text-zinc-100">
                          {getName(featuredWorkspace)}
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#dc9458]"
                    />
                  </div>

                  <div className="relative mt-7">
                    <p className="max-w-[360px] text-[11px] leading-5 text-zinc-500">
                      {featuredWorkspace.description ||
                        "Your workspace is ready. Open the editor and keep building."}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-black/20 px-2 py-1.5 text-[9px] text-zinc-400">
                        <Clock3 size={10} />
                        {getRelativeTime(
                          featuredWorkspace.updatedAt ||
                            featuredWorkspace.lastOpenedAt ||
                            featuredWorkspace.createdAt
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-black/20 px-2 py-1.5 text-[9px] text-zinc-400">
                        {getVisibility(featuredWorkspace) === "public" ? (
                          <Globe2 size={10} />
                        ) : (
                          <LockKeyhole size={10} />
                        )}
                        {getVisibility(featuredWorkspace) === "public"
                          ? "Public"
                          : "Private"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* OTHER WORKSPACES */}

                <div className="flex flex-col gap-3">
                  {sortedWorkspaces.slice(1, 3).map((workspace) => (
                    <button
                      key={workspace._id || workspace.id}
                      type="button"
                      onClick={() => handleOpenWorkspace(workspace)}
                      className="group flex min-h-[105px] items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111214] p-4 text-left transition-all hover:border-white/[0.14] hover:bg-[#151618] sm:gap-4 sm:p-5"
                    >
                      <LanguageIcon language={workspace.language} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-zinc-200 transition-colors group-hover:text-white">
                          {getName(workspace)}
                        </p>

                        <p className="mt-1.5 truncate text-[10px] text-zinc-600">
                          {workspace.description || "No description"}
                        </p>

                        <p className="mt-2 text-[9px] text-zinc-600">
                          {getRelativeTime(
                            workspace.updatedAt ||
                              workspace.lastOpenedAt ||
                              workspace.createdAt
                          )}
                        </p>
                      </div>

                      <ArrowUpRight
                        size={15}
                        className="shrink-0 text-zinc-700 transition-colors group-hover:text-[#dc9458]"
                      />
                    </button>
                  ))}

                  {sortedWorkspaces.length === 1 && (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="flex min-h-[105px] flex-1 items-center gap-3 rounded-xl border border-dashed border-white/[0.09] bg-[#111214]/50 p-5 text-left transition-colors hover:border-[#dc9458]/30 hover:bg-[#111214]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dc9458]/[0.08] text-[#dc9458]">
                        <Plus size={17} />
                      </span>

                      <span>
                        <span className="block text-[11px] font-medium text-zinc-300">
                          Start another project
                        </span>
                        <span className="mt-1 block text-[10px] text-zinc-600">
                          Create a new workspace
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <EmptyWorkspaces
                onCreate={() => setShowCreateModal(true)}
              />
            )}
          </section>

          {/* ALL PROJECTS */}

          <section className="mb-11">
            <SectionHeading
              eyebrow="YOUR DEVELOPMENT SPACE"
              title="Your workspaces"
              description="Browse your projects and open any workspace to continue."
              action={
                <span className="rounded-md border border-white/[0.07] px-2.5 py-1.5 text-[9px] text-zinc-500">
                  {workspaces.length}{" "}
                  {workspaces.length === 1 ? "PROJECT" : "PROJECTS"}
                </span>
              }
            />

            {workspaces.length > 0 && (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-[300px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search workspaces..."
                    aria-label="Search workspaces"
                    className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#111214] pl-9 pr-9 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#dc9458]/35"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#111214] px-3.5 text-[10px] font-medium text-zinc-300 transition-colors hover:border-[#dc9458]/30 hover:text-[#dc9458]"
                >
                  <Plus size={13} />
                  Create workspace
                </button>
              </div>
            )}

            {filteredWorkspaces.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#111214] px-5 py-10 text-center">
                <Search
                  size={19}
                  className="mx-auto text-zinc-600"
                />

                <p className="mt-3 text-[12px] font-medium text-zinc-300">
                  {workspaces.length === 0
                    ? "No workspaces yet"
                    : "No matching workspaces"}
                </p>

                <p className="mt-1 text-[10px] text-zinc-600">
                  {workspaces.length === 0
                    ? "Create a workspace to get started."
                    : "Try a different name or programming language."}
                </p>

                {workspaces.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 rounded-lg bg-[#dc9458] px-4 py-2.5 text-[10px] font-semibold text-[#17110d] hover:bg-[#eca267]"
                  >
                    Create workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-[10px] text-[#dc9458] hover:text-[#eca267]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace._id || workspace.id}
                    workspace={workspace}
                    onOpen={handleOpenWorkspace}
                    onDelete={handleDeleteWorkspace}
                    deleting={deleteWorkspaceMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          {/* COLLABORATION OVERVIEW */}

          <section>
            <SectionHeading
              eyebrow="BUILD TOGETHER"
              title="Collaboration overview"
              description="A quick look at your shared development space."
            />

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="flex items-start gap-4 rounded-xl border border-white/[0.07] bg-[#111214] p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a67adb]/[0.1] text-[#a67adb]">
                  <Users size={18} strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[12px] font-semibold text-zinc-200">
                    Work with your team
                  </h3>

                  <p className="mt-1.5 max-w-[350px] text-[10px] leading-5 text-zinc-600">
                    {stats.teamWorkspaces > 0
                      ? `You have ${stats.teamWorkspaces} workspace${stats.teamWorkspaces === 1 ? "" : "s"} with members. Open one to continue collaborating.`
                      : "Invite teammates to a workspace and build together in your shared coding environment."}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/shared")}
                    className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#dc9458] transition-colors hover:text-[#eca267]"
                  >
                    Explore shared workspaces
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-white/[0.07] bg-[#111214] p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#65bc8d]/[0.1] text-[#65bc8d]">
                  <FileCode2 size={18} strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[12px] font-semibold text-zinc-200">
                    Keep your ideas moving
                  </h3>

                  <p className="mt-1.5 max-w-[350px] text-[10px] leading-5 text-zinc-600">
                    {stats.total > 0
                      ? `You have ${stats.total} workspace${stats.total === 1 ? "" : "s"} available across ${stats.languages} configured language${stats.languages === 1 ? "" : "s"}. Pick a project and keep making progress.`
                      : "Create your first workspace to organize your code and start building."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      stats.total > 0
                        ? handleOpenWorkspace(featuredWorkspace)
                        : setShowCreateModal(true)
                    }
                    className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#65bc8d] transition-colors hover:text-[#8bd4aa]"
                  >
                    {stats.total > 0
                      ? "Continue building"
                      : "Create your first project"}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] pt-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#dc9458]/[0.1] text-[#dc9458]">
                <Code2 size={12} />
              </span>

              <span className="text-[10px] font-semibold tracking-wide text-zinc-500">
                DevSpace
              </span>

              <span className="text-[9px] text-zinc-700">
                · Your space to build
              </span>
            </div>

            <div className="flex items-center gap-2 text-[9px] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Dashboard ready
            </div>
          </footer>
        </div>
      </main>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleWorkspaceCreated}
      />

      {createWorkspaceMutation.isPending && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#18191c] px-4 py-3 shadow-xl">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#dc9458]/25 border-t-[#dc9458]" />
          <span className="text-[10px] text-zinc-300">
            Creating workspace...
          </span>
        </div>
      )}
    </>
  );
};

export default DashboardPage;