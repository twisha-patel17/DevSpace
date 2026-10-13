
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Users,
  ExternalLink,
  Clock3,
  Eye,
  Pencil,
  Code2,
  FolderGit2,
  RefreshCw,
} from "lucide-react";

import { useSharedWorkspaces } from "../lib/workspace.queries";

const languageStyles = {
  JavaScript: {
    short: "JS",
    className: "bg-[#302f1c] text-[#e5c82d]",
  },
  React: {
    short: "RE",
    className: "bg-[#202c30] text-[#63c5d8]",
  },
  Python: {
    short: "PY",
    className: "bg-[#1c3029] text-[#65bc8d]",
  },
  "C++": {
    short: "C++",
    className: "bg-[#25203a] text-[#a67adb]",
  },
  "Node.js": {
    short: "JS",
    className: "bg-[#24301f] text-[#8bcf65]",
  },
  Blank: {
    short: "—",
    className: "bg-[#252629] text-zinc-300",
  },
};

const getLanguageInfo = (language) => {
  if (!language) return languageStyles.Blank;

  return (
    languageStyles[language] || {
      short: language.slice(0, 3).toUpperCase(),
      className: "bg-[#252629] text-zinc-300",
    }
  );
};

const getInitials = (name = "") => {
  const value = String(name).trim();

  if (!value) return "?";

  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getOwnerName = (workspace) => {
  const owner = workspace.owner || workspace.createdBy;

  return (
    owner?.username ||
    owner?.name ||
    workspace.ownerName ||
    "Unknown user"
  );
};

const getIdString = (value) => {
  if (value == null) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

const getWorkspaceRole = (workspace) => {
  const directRole = workspace.role || workspace.memberRole;

  if (directRole) {
    return String(directRole).toLowerCase();
  }

  const currentUserId = getIdString(
    workspace.currentUserId
  );

  if (!currentUserId) {
    return "viewer";
  }

  const currentMember = workspace.members?.find((member) => {
    const memberUserId = getIdString(
      member.user || member.userId
    );

    return memberUserId === currentUserId;
  });

  return String(currentMember?.role || "viewer").toLowerCase();
};

const formatUpdatedAt = (date) => {
  if (!date) return "Recently updated";

  const updatedDate = new Date(date);

  if (Number.isNaN(updatedDate.getTime())) {
    return "Recently updated";
  }

  const diff = Math.max(0, Date.now() - updatedDate.getTime());
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return updatedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      updatedDate.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
};

const UserAvatar = ({ name, avatar }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || "User"}
        className="h-7 w-7 rounded-full border-2 border-[#111214] object-cover"
      />
    );
  }

  return (
    <div
      className="
        flex h-7 w-7 items-center justify-center
        rounded-full border-2 border-[#111214]
        bg-[#dc9458]/15 text-[8px] font-bold text-[#dc9458]
      "
    >
      {getInitials(name)}
    </div>
  );
};

const MemberStack = ({ workspace }) => {
  const members = workspace.members || [];
  const visibleMembers = members.slice(0, 4);

  if (visibleMembers.length === 0) {
    return (
      <div className="flex items-center">
        <UserAvatar
          name={getOwnerName(workspace)}
          avatar={workspace.owner?.avatar}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => {
        const memberUser = member.user || member;

        const name =
          memberUser.username ||
          memberUser.name ||
          member.username ||
          "User";

        const avatar = memberUser.avatar || member.avatar;

        return (
          <div
            key={
              getIdString(memberUser) ||
              getIdString(member.userId) ||
              `${name}-${index}`
            }
            className={index !== 0 ? "-ml-2" : ""}
          >
            <UserAvatar name={name} avatar={avatar} />
          </div>
        );
      })}

      {members.length > 4 && (
        <span
          className="
            -ml-2 flex h-7 w-7 items-center justify-center
            rounded-full border-2 border-[#111214]
            bg-[#252629] text-[8px] font-semibold text-zinc-400
          "
        >
          +{members.length - 4}
        </span>
      )}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const normalizedRole = role?.toLowerCase() || "viewer";

  if (normalizedRole === "editor") {
    return (
      <span
        className="
          inline-flex items-center gap-1.5 rounded-md border
          border-[#dc9458]/15 bg-[#dc9458]/[0.07]
          px-2 py-1 text-[9px] font-medium text-[#dc9458]
        "
      >
        <Pencil size={10} />
        Editor
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex items-center gap-1.5 rounded-md border
        border-white/[0.07] bg-white/[0.03]
        px-2 py-1 text-[9px] font-medium text-zinc-500
      "
    >
      <Eye size={10} />
      Viewer
    </span>
  );
};

const SharedWorkspaceCard = ({ workspace }) => {
  const navigate = useNavigate();

  const language = workspace.language || "Blank";
  const languageInfo = getLanguageInfo(language);
  const role = getWorkspaceRole(workspace);
  const ownerName = getOwnerName(workspace);

  const membersCount = Math.max(
    1,
    workspace.members?.length || 0
  );

  const updatedAt =
    workspace.updatedAt ||
    workspace.lastOpenedAt ||
    workspace.createdAt;

  const openWorkspace = () => {
    if (!workspace._id) return;

    navigate(`/workspaces/${workspace._id}`);
  };

  return (
    <article
      className="
        group relative flex min-h-[285px] flex-col overflow-hidden
        rounded-xl border border-white/[0.075] bg-[#111214] p-5
        transition-all duration-200
        hover:-translate-y-0.5 hover:border-white/[0.13]
        hover:bg-[#141517]
      "
    >
      <div
        className="
          pointer-events-none absolute left-0 right-0 top-0 h-px
          bg-gradient-to-r from-transparent via-[#dc9458]/20 to-transparent
          opacity-0 transition-opacity duration-200 group-hover:opacity-100
        "
      />

      <div className="flex items-start justify-between">
        <div
          className={`
            flex h-10 w-10 items-center justify-center rounded-lg
            font-mono text-[9px] font-semibold ${languageInfo.className}
          `}
        >
          {languageInfo.short}
        </div>

        <div
          className="
            flex items-center gap-1.5 rounded-md border
            border-white/[0.06] bg-white/[0.025]
            px-2 py-1 text-[8px] font-medium text-zinc-600
          "
        >
          <Users size={10} />
          Shared
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <h3
            className="
              min-w-0 truncate text-[15px] font-semibold
              tracking-[-0.02em] text-zinc-200
            "
          >
            {workspace.name || "Untitled workspace"}
          </h3>

          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        </div>

        <p
          className="
            mt-1.5 line-clamp-2 min-h-[32px]
            text-[11px] leading-4 text-zinc-600
          "
        >
          {workspace.description || "No description"}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <UserAvatar
          name={ownerName}
          avatar={
            workspace.owner?.avatar ||
            workspace.createdBy?.avatar
          }
        />

        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-700">
            Shared by
          </p>

          <p className="truncate text-[10px] font-medium text-zinc-400">
            {ownerName}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div
          className="
            flex items-center justify-between border-t
            border-white/[0.05] pt-4
          "
        >
          <div className="flex items-center gap-2.5">
            <MemberStack workspace={workspace} />

            <span className="text-[9px] text-zinc-600">
              {membersCount}{" "}
              {membersCount === 1 ? "member" : "members"}
            </span>
          </div>

          <RoleBadge role={role} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] text-zinc-700">
            <Clock3 size={11} />
            {formatUpdatedAt(updatedAt)}
          </span>

          <button
            type="button"
            onClick={openWorkspace}
            disabled={!workspace._id}
            className="
              flex h-8 items-center gap-1.5 rounded-lg border
              border-white/[0.07] bg-white/[0.02] px-3
              text-[9px] font-medium text-zinc-400
              transition-all duration-200
              hover:border-[#dc9458]/25 hover:bg-[#dc9458]/[0.07]
              hover:text-[#dc9458]
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            Open
            <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </article>
  );
};

const SharedWithMePage = () => {
  const {
    data: sharedWorkspaces = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSharedWorkspaces();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Ensure the page always works with an array, even if the
  // API response shape is unexpectedly different.
  const workspaces = Array.isArray(sharedWorkspaces)
    ? sharedWorkspaces
    : [];

  const filteredWorkspaces = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return workspaces.filter((workspace) => {
      const name = workspace.name?.toLowerCase() || "";
      const description =
        workspace.description?.toLowerCase() || "";

      const owner = (
        workspace.owner?.username ||
        workspace.owner?.name ||
        workspace.createdBy?.username ||
        workspace.createdBy?.name ||
        workspace.ownerName ||
        ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        description.includes(searchValue) ||
        owner.includes(searchValue);

      const role = getWorkspaceRole(workspace);

      const matchesRole =
        roleFilter === "All" ||
        role === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [workspaces, search, roleFilter]);

  const editorCount = workspaces.filter(
    (workspace) => getWorkspaceRole(workspace) === "editor"
  ).length;

  const viewerCount = workspaces.filter(
    (workspace) => getWorkspaceRole(workspace) === "viewer"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("All");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#090a0b] text-zinc-100">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div
              className="
                mx-auto h-8 w-8 animate-spin rounded-full
                border-2 border-white/[0.08] border-t-[#dc9458]
              "
            />

            <p className="mt-4 text-[11px] text-zinc-600">
              Loading shared workspaces...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#090a0b] text-zinc-100">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div
              className="
                mx-auto flex h-11 w-11 items-center justify-center
                rounded-xl bg-red-500/[0.08] text-red-400
              "
            >
              <Code2 size={18} />
            </div>

            <h3 className="mt-4 text-[13px] font-semibold text-zinc-300">
              Failed to load shared workspaces
            </h3>

            <p className="mt-2 text-[10px] leading-5 text-zinc-600">
              {error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while fetching your shared workspaces."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="
                mt-5 inline-flex h-9 items-center gap-2 rounded-lg
                border border-[#dc9458]/20 bg-[#dc9458]/[0.07]
                px-4 text-[10px] font-medium text-[#dc9458]
                transition-colors hover:bg-[#dc9458]/[0.12]
                disabled:opacity-50
              "
            >
              <RefreshCw
                size={12}
                className={isFetching ? "animate-spin" : ""}
              />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100">
      <div className="px-4 pb-14 pt-[100px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <section
            className="
              mb-8 flex flex-col gap-5
              sm:flex-row sm:items-end sm:justify-between
            "
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#dc9458]" />

                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                  Collaboration
                </span>
              </div>

              <h1 className="text-[25px] font-bold tracking-[-0.04em] text-[#ededee] sm:text-[28px]">
                Shared with me
              </h1>

              <p className="mt-1.5 text-[13px] text-zinc-600">
                Workspaces other developers have shared with you.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="
                inline-flex h-9 items-center justify-center gap-2
                self-start rounded-lg border border-white/[0.07]
                bg-[#111214] px-3 text-[10px] text-zinc-400
                transition-colors hover:border-white/[0.13]
                hover:text-zinc-200
                disabled:opacity-50 sm:self-auto
              "
            >
              <RefreshCw
                size={12}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-[#111214] p-4">
              <div className="flex items-center justify-between">
                <Users size={16} className="text-[#dc9458]" />
                <span className="text-[9px] text-zinc-700">SHARED</span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {workspaces.length}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Workspaces shared with you
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#111214] p-4">
              <div className="flex items-center justify-between">
                <Pencil size={16} className="text-[#dc9458]" />
                <span className="text-[9px] text-zinc-700">EDITOR</span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {editorCount}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                You can edit
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#111214] p-4">
              <div className="flex items-center justify-between">
                <Eye size={16} className="text-[#73a8e9]" />
                <span className="text-[9px] text-zinc-700">VIEWER</span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {viewerCount}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Read-only access
              </p>
            </div>
          </section>

          <section className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="group relative flex-1">
                <Search
                  size={15}
                  strokeWidth={1.8}
                  className="
                    pointer-events-none absolute left-3.5 top-1/2
                    -translate-y-1/2 text-zinc-600
                    transition-colors group-focus-within:text-[#dc9458]
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search shared workspaces..."
                  className="
                    h-10 w-full rounded-lg border border-white/[0.07]
                    bg-[#111214] pl-10 pr-4 text-[11px] text-zinc-300
                    outline-none placeholder:text-zinc-700 transition-all
                    hover:border-white/[0.11] focus:border-[#dc9458]/30
                    focus:bg-[#121315] focus:ring-4 focus:ring-[#dc9458]/[0.04]
                  "
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="
                  h-10 rounded-lg border border-white/[0.07]
                  bg-[#111214] px-3.5 text-[11px] text-zinc-400
                  outline-none transition-all hover:border-white/[0.12]
                  focus:border-[#dc9458]/30 focus:ring-4
                  focus:ring-[#dc9458]/[0.04] sm:w-[180px]
                "
              >
                <option value="All">All access</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-zinc-700">
                {filteredWorkspaces.length}{" "}
                {filteredWorkspaces.length === 1
                  ? "workspace"
                  : "workspaces"}
              </p>

              {(search || roleFilter !== "All") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    text-[10px] font-medium text-[#dc9458]
                    transition-colors hover:text-[#e5a067]
                  "
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {filteredWorkspaces.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWorkspaces.map((workspace) => (
                <SharedWorkspaceCard
                  key={workspace._id}
                  workspace={workspace}
                />
              ))}
            </section>
          ) : (
            <section
              className="
                flex min-h-[300px] flex-col items-center justify-center
                rounded-xl border border-dashed border-white/[0.08]
                bg-[#111214] px-6 text-center
              "
            >
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl bg-[#241d19] text-[#dc9458]
                "
              >
                {workspaces.length === 0 ? (
                  <FolderGit2 size={18} />
                ) : (
                  <Search size={18} />
                )}
              </div>

              <h3 className="mt-4 text-[13px] font-semibold text-zinc-300">
                {workspaces.length === 0
                  ? "Nothing shared with you"
                  : "No shared workspaces found"}
              </h3>

              <p className="mt-1 max-w-[320px] text-[10px] leading-4 text-zinc-600">
                {workspaces.length === 0
                  ? "When another developer shares a workspace with you, it will appear here."
                  : "Try changing your search or access filter."}
              </p>

              {(search || roleFilter !== "All") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    mt-4 text-[10px] font-medium text-[#dc9458]
                    transition-colors hover:text-[#e5a067]
                  "
                >
                  Clear filters
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default SharedWithMePage;