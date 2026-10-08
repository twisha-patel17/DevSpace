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
  if (!language) {
    return languageStyles.Blank;
  }

  return (
    languageStyles[language] ||
    {
      short: language.slice(0, 3).toUpperCase(),
      className:
        "bg-[#252629] text-zinc-300",
    }
  );
};

const getInitials = (name = "") => {
  const value = name.trim();

  if (!value) return "?";

  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
};

const getOwnerName = (workspace) => {
  return (
    workspace.owner?.username ||
    workspace.owner?.name ||
    workspace.createdBy?.username ||
    workspace.createdBy?.name ||
    workspace.ownerName ||
    "Unknown user"
  );
};

const getWorkspaceRole = (workspace) => {
  return (
    workspace.role ||
    workspace.memberRole ||
    workspace.members?.find(
      (member) =>
        member.user?._id === workspace.currentUserId ||
        member.userId === workspace.currentUserId
    )?.role ||
    "viewer"
  ).toLowerCase();
};

const formatUpdatedAt = (date) => {
  if (!date) {
    return "Recently updated";
  }

  const updatedDate = new Date(date);

  if (Number.isNaN(updatedDate.getTime())) {
    return "Recently updated";
  }

  const diff =
    Date.now() - updatedDate.getTime();

  const minutes = Math.floor(
    diff / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return updatedDate.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year:
        updatedDate.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );
};

const UserAvatar = ({
  name,
  avatar,
}) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="
          h-7
          w-7
          rounded-full
          border-2
          border-[#111214]
          object-cover
        "
      />
    );
  }

  return (
    <div
      className="
        flex
        h-7
        w-7
        items-center
        justify-center
        rounded-full
        border-2
        border-[#111214]
        bg-[#dc9458]/15
        text-[8px]
        font-bold
        text-[#dc9458]
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
      {visibleMembers.map(
        (member, index) => {
          const memberUser =
            member.user || member;

          const name =
            memberUser.username ||
            memberUser.name ||
            member.username ||
            "User";

          const avatar =
            memberUser.avatar ||
            member.avatar;

          return (
            <div
              key={
                memberUser._id ||
                member.userId ||
                index
              }
              className={
                index !== 0
                  ? "-ml-2"
                  : ""
              }
            >
              <UserAvatar
                name={name}
                avatar={avatar}
              />
            </div>
          );
        }
      )}

      {members.length > 4 && (
        <span
          className="
            -ml-2
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border-2
            border-[#111214]
            bg-[#252629]
            text-[8px]
            font-semibold
            text-zinc-400
          "
        >
          +{members.length - 4}
        </span>
      )}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const normalizedRole =
    role?.toLowerCase() || "viewer";

  if (normalizedRole === "editor") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-md
          border
          border-[#dc9458]/15
          bg-[#dc9458]/[0.07]
          px-2
          py-1
          text-[9px]
          font-medium
          text-[#dc9458]
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
        inline-flex
        items-center
        gap-1.5
        rounded-md
        border
        border-white/[0.07]
        bg-white/[0.03]
        px-2
        py-1
        text-[9px]
        font-medium
        text-zinc-500
      "
    >
      <Eye size={10} />
      Viewer
    </span>
  );
};

const SharedWorkspaceCard = ({
  workspace,
}) => {
  const navigate = useNavigate();

  const language =
    workspace.language || "Blank";

  const languageInfo =
    getLanguageInfo(language);

  const role =
    getWorkspaceRole(workspace);

  const membersCount =
    workspace.members?.length || 1;

  const ownerName =
    getOwnerName(workspace);

  const updatedAt =
    workspace.updatedAt ||
    workspace.lastOpenedAt ||
    workspace.createdAt;

  const openWorkspace = () => {
    navigate(
      `/workspaces/${workspace._id}`
    );
  };

  return (
    <article
      className="
        group
        relative
        flex
        min-h-[285px]
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-white/[0.075]
        bg-[#111214]
        p-5
        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:border-white/[0.13]
        hover:bg-[#141517]
      "
    >
      {/* subtle top accent */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-[#dc9458]/20
          to-transparent
          opacity-0
          transition-opacity
          duration-200
          group-hover:opacity-100
        "
      />

      <div
        className="
          flex
          items-start
          justify-between
        "
      >
        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            font-mono
            text-[9px]
            font-semibold
            ${languageInfo.className}
          `}
        >
          {languageInfo.short}
        </div>

        <div
          className="
            flex
            items-center
            gap-1.5
            rounded-md
            border
            border-white/[0.06]
            bg-white/[0.025]
            px-2
            py-1
            text-[8px]
            font-medium
            text-zinc-600
          "
        >
          <Users size={10} />
          Shared
        </div>
      </div>

      <div className="mt-5">
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <h3
            className="
              min-w-0
              truncate
              text-[15px]
              font-semibold
              tracking-[-0.02em]
              text-zinc-200
            "
          >
            {workspace.name}
          </h3>

          <span
            className="
              h-1.5
              w-1.5
              shrink-0
              rounded-full
              bg-emerald-400
              shadow-[0_0_6px_rgba(52,211,153,0.35)]
            "
          />
        </div>

        <p
          className="
            mt-1.5
            min-h-[32px]
            line-clamp-2
            text-[11px]
            leading-4
            text-zinc-600
          "
        >
          {workspace.description ||
            "No description"}
        </p>
      </div>

      <div
        className="
          mt-4
          flex
          items-center
          gap-2.5
        "
      >
        <UserAvatar
          name={ownerName}
          avatar={
            workspace.owner?.avatar ||
            workspace.createdBy?.avatar
          }
        />

        <div className="min-w-0">
          <p
            className="
              text-[8px]
              uppercase
              tracking-[0.12em]
              text-zinc-700
            "
          >
            Shared by
          </p>

          <p
            className="
              truncate
              text-[10px]
              font-medium
              text-zinc-400
            "
          >
            {ownerName}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-white/[0.05]
            pt-4
          "
        >
          <div className="flex items-center gap-2.5">
            <MemberStack
              workspace={workspace}
            />

            <span
              className="
                text-[9px]
                text-zinc-600
              "
            >
              {membersCount}{" "}
              {membersCount === 1
                ? "member"
                : "members"}
            </span>
          </div>

          <RoleBadge role={role} />
        </div>

        <div
          className="
            mt-4
            flex
            items-center
            justify-between
          "
        >
          <span
            className="
              flex
              items-center
              gap-1.5
              text-[9px]
              text-zinc-700
            "
          >
            <Clock3 size={11} />

            {formatUpdatedAt(
              updatedAt
            )}
          </span>

          <button
            type="button"
            onClick={openWorkspace}
            className="
              flex
              h-8
              items-center
              gap-1.5
              rounded-lg
              border
              border-white/[0.07]
              bg-white/[0.02]
              px-3
              text-[9px]
              font-medium
              text-zinc-400
              transition-all
              duration-200

              hover:border-[#dc9458]/25
              hover:bg-[#dc9458]/[0.07]
              hover:text-[#dc9458]
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
  } = useSharedWorkspaces();

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const filteredWorkspaces = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return sharedWorkspaces.filter(
      (workspace) => {
        const name =
          workspace.name?.toLowerCase() ||
          "";

        const description =
          workspace.description?.toLowerCase() ||
          "";

        const owner =
          workspace.owner?.username
            ?.toLowerCase() ||
          workspace.owner?.name
            ?.toLowerCase() ||
          workspace.createdBy?.username
            ?.toLowerCase() ||
          workspace.createdBy?.name
            ?.toLowerCase() ||
          workspace.ownerName?.toLowerCase() ||
          "";

        const matchesSearch =
          !searchValue ||
          name.includes(searchValue) ||
          description.includes(searchValue) ||
          owner.includes(searchValue);

        const role =
          getWorkspaceRole(
            workspace
          );

        const matchesRole =
          roleFilter === "All" ||
          role ===
            roleFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesRole
        );
      }
    );
  }, [
    sharedWorkspaces,
    search,
    roleFilter,
  ]);

  const editorCount =
    sharedWorkspaces.filter(
      (workspace) =>
        getWorkspaceRole(
          workspace
        ) === "editor"
    ).length;

  const viewerCount =
    sharedWorkspaces.filter(
      (workspace) =>
        getWorkspaceRole(
          workspace
        ) === "viewer"
    ).length;

  if (isLoading) {
    return (
      <main
        className="
          min-h-screen
          bg-[#090a0b]
          text-zinc-100
        "
      >
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-6
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-white/[0.08]
                border-t-[#dc9458]
              "
            />

            <p
              className="
                mt-4
                text-[11px]
                text-zinc-600
              "
            >
              Loading shared workspaces...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (isError) {
    return (
      <main
        className="
          min-h-screen
          bg-[#090a0b]
          text-zinc-100
        "
      >
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-6
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-red-500/[0.08]
                text-red-400
              "
            >
              <Code2 size={18} />
            </div>

            <h3
              className="
                mt-4
                text-[13px]
                font-semibold
                text-zinc-300
              "
            >
              Failed to load shared workspaces
            </h3>

            <p
              className="
                mt-1
                text-[10px]
                text-zinc-600
              "
            >
              {error?.response?.data
                ?.message ||
                "Something went wrong."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#090a0b]
        text-zinc-100
      "
    >
      <div
        className="
          px-4
          pb-14
          pt-[100px]
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1280px]
          "
        >
          <section
            className="
              mb-8
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#dc9458]
                  "
                />

                <span
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.16em]
                    text-zinc-600
                  "
                >
                  Collaboration
                </span>
              </div>

              <h1
                className="
                  text-[25px]
                  font-bold
                  tracking-[-0.04em]
                  text-[#ededee]
                  sm:text-[28px]
                "
              >
                Shared with me
              </h1>

              <p
                className="
                  mt-1.5
                  text-[13px]
                  text-zinc-600
                "
              >
                Workspaces other developers have
                shared with you.
              </p>
            </div>
          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <section
            className="
              mb-8
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >
            {/* TOTAL */}

            <div
              className="
                rounded-xl
                border
                border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <Users
                  size={16}
                  className="text-[#dc9458]"
                />

                <span
                  className="
                    text-[9px]
                    text-zinc-700
                  "
                >
                  SHARED
                </span>
              </div>

              <p
                className="
                  mt-4
                  text-xl
                  font-bold
                  text-zinc-200
                "
              >
                {sharedWorkspaces.length}
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-zinc-600
                "
              >
                Workspaces shared with you
              </p>
            </div>

            {/* EDITOR */}

            <div
              className="
                rounded-xl
                border
                border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <Pencil
                  size={16}
                  className="text-[#dc9458]"
                />

                <span
                  className="
                    text-[9px]
                    text-zinc-700
                  "
                >
                  EDITOR
                </span>
              </div>

              <p
                className="
                  mt-4
                  text-xl
                  font-bold
                  text-zinc-200
                "
              >
                {editorCount}
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-zinc-600
                "
              >
                You can edit
              </p>
            </div>

            {/* VIEWER */}

            <div
              className="
                rounded-xl
                border
                border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <Eye
                  size={16}
                  className="text-[#73a8e9]"
                />

                <span
                  className="
                    text-[9px]
                    text-zinc-700
                  "
                >
                  VIEWER
                </span>
              </div>

              <p
                className="
                  mt-4
                  text-xl
                  font-bold
                  text-zinc-200
                "
              >
                {viewerCount}
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-zinc-600
                "
              >
                Read-only access
              </p>
            </div>
          </section>

          <section className="mb-6">
            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
              "
            >
              <div
                className="
                  group
                  relative
                  flex-1
                "
              >
                <Search
                  size={15}
                  strokeWidth={1.8}
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-zinc-600
                    transition-colors
                    group-focus-within:text-[#dc9458]
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search shared workspaces..."
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-white/[0.07]
                    bg-[#111214]
                    pl-10
                    pr-4
                    text-[11px]
                    text-zinc-300
                    outline-none
                    placeholder:text-zinc-700
                    transition-all

                    hover:border-white/[0.11]
                    focus:border-[#dc9458]/30
                    focus:bg-[#121315]
                    focus:ring-4
                    focus:ring-[#dc9458]/[0.04]
                  "
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
                className="
                  h-10
                  rounded-lg
                  border
                  border-white/[0.07]
                  bg-[#111214]
                  px-3.5
                  text-[11px]
                  text-zinc-400
                  outline-none
                  transition-all

                  hover:border-white/[0.12]
                  focus:border-[#dc9458]/30
                  focus:ring-4
                  focus:ring-[#dc9458]/[0.04]

                  sm:w-[180px]
                "
              >
                <option value="All">
                  All access
                </option>

                <option value="Editor">
                  Editor
                </option>

                <option value="Viewer">
                  Viewer
                </option>
              </select>
            </div>

            <div
              className="
                mt-3
                flex
                items-center
                justify-between
              "
            >
              <p
                className="
                  text-[10px]
                  text-zinc-700
                "
              >
                {filteredWorkspaces.length}{" "}
                {filteredWorkspaces.length === 1
                  ? "workspace"
                  : "workspaces"}
              </p>

              {(search ||
                roleFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("All");
                  }}
                  className="
                    text-[10px]
                    font-medium
                    text-[#dc9458]
                    transition-colors
                    hover:text-[#e5a067]
                  "
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {filteredWorkspaces.length > 0 ? (
            <section
              className="
                grid
                gap-3
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {filteredWorkspaces.map(
                (workspace) => (
                  <SharedWorkspaceCard
                    key={workspace._id}
                    workspace={workspace}
                  />
                )
              )}
            </section>
          ) : (
            <section
              className="
                flex
                min-h-[300px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-white/[0.08]
                bg-[#111214]
                px-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#241d19]
                  text-[#dc9458]
                "
              >
                {sharedWorkspaces.length ===
                0 ? (
                  <FolderGit2 size={18} />
                ) : (
                  <Search size={18} />
                )}
              </div>

              <h3
                className="
                  mt-4
                  text-[13px]
                  font-semibold
                  text-zinc-300
                "
              >
                {sharedWorkspaces.length === 0
                  ? "Nothing shared with you"
                  : "No shared workspaces found"}
              </h3>

              <p
                className="
                  mt-1
                  max-w-[320px]
                  text-[10px]
                  leading-4
                  text-zinc-600
                "
              >
                {sharedWorkspaces.length === 0
                  ? "When another developer shares a workspace with you, it will appear here."
                  : "Try changing your search or access filter."}
              </p>

              {(search ||
                roleFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("All");
                  }}
                  className="
                    mt-4
                    text-[10px]
                    font-medium
                    text-[#dc9458]
                    transition-colors
                    hover:text-[#e5a067]
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