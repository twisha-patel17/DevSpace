import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MoreVertical,
  UserRound,
  FileText,
  Activity,
  ArrowUpRight,
  Code2,
  Users,
  Clock3,
  FolderKanban,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  LoaderCircle,
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

const getInitials = (user) => {
  if (!user) return "?";

  const name =
    user.username ||
    user.name ||
    user.email ||
    "";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getUserName = (user) => {
  if (!user) return "Unknown user";

  return (
    user.username ||
    user.name ||
    user.email ||
    "Unknown user"
  );
};

const getLanguageInfo = (language) => {
  const normalized = String(language || "")
    .toLowerCase()
    .trim();

  const languages = {
    javascript: {
      short: "JS",
      name: "JavaScript",
      className: "bg-[#302f1c] text-[#e5c82d]",
    },

    js: {
      short: "JS",
      name: "JavaScript",
      className: "bg-[#302f1c] text-[#e5c82d]",
    },

    typescript: {
      short: "TS",
      name: "TypeScript",
      className: "bg-[#1c2638] text-[#72a4e2]",
    },

    ts: {
      short: "TS",
      name: "TypeScript",
      className: "bg-[#1c2638] text-[#72a4e2]",
    },

    "c++": {
      short: "C++",
      name: "C++",
      className: "bg-[#1c2638] text-[#72a4e2]",
    },

    cpp: {
      short: "C++",
      name: "C++",
      className: "bg-[#1c2638] text-[#72a4e2]",
    },

    python: {
      short: "PY",
      name: "Python",
      className: "bg-[#1c3029] text-[#65bc8d]",
    },

    java: {
      short: "JAVA",
      name: "Java",
      className: "bg-[#30231d] text-[#df9758]",
    },

    go: {
      short: "GO",
      name: "Go",
      className: "bg-[#1d2d31] text-[#66c7d4]",
    },

    rust: {
      short: "RS",
      name: "Rust",
      className: "bg-[#30251e] text-[#d99a67]",
    },
  };

  return (
    languages[normalized] || {
      short:
        String(language || "CODE")
          .slice(0, 4)
          .toUpperCase(),

      name:
        language || "Unknown",

      className:
        "bg-[#242528] text-zinc-400",
    }
  );
};

const getWorkspaceRole = (workspace) => {
  return (
    workspace?.role ||
    workspace?.memberRole ||
    "owner"
  );
};

const getCollaborators = (workspace) => {
  if (Array.isArray(workspace?.members)) {
    return workspace.members.length;
  }

  return 0;
};

const getWorkspaceMembers = (workspace) => {
  if (!Array.isArray(workspace?.members)) {
    return [];
  }

  return workspace.members;
};

const formatRelativeTime = (date) => {
  if (!date) return "No recent activity";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const difference = Date.now() - timestamp;

  if (difference < 60 * 1000) {
    return "Just now";
  }

  const minutes = Math.floor(
    difference / (60 * 1000)
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    difference / (60 * 60 * 1000)
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    difference / (24 * 60 * 60 * 1000)
  );

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(months / 12)}y ago`;
};

/* =========================================================
   AVATAR
========================================================= */

const UserAvatar = ({
  user,
  index = 0,
}) => {
  const styles = [
    "bg-[#df9758] text-[#17110d]",
    "bg-[#73a8e9] text-[#111214]",
    "bg-[#a67adb] text-[#111214]",
    "bg-[#65bc8d] text-[#111214]",
  ];

  const avatarUrl =
    user?.avatar ||
    user?.profilePicture ||
    null;

  return (
    <span
      className={`
        flex h-6 w-6
        shrink-0
        items-center justify-center
        overflow-hidden
        rounded-full
        border-2 border-[#111214]
        text-[7px]
        font-bold
        ${styles[index % styles.length]}
      `}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={getUserName(user)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(user)
      )}
    </span>
  );
};

/* =========================================================
   AVATAR STACK
========================================================= */

const AvatarStack = ({
  workspace,
}) => {
  const members = getWorkspaceMembers(
    workspace
  );

  const owner =
    workspace?.owner ||
    workspace?.createdBy ||
    null;

  const people = [];

  if (owner) {
    people.push(owner);
  }

  members.forEach((member) => {
    const user =
      member?.user ||
      member;

    if (
      user &&
      !people.some(
        (existing) =>
          String(existing?._id) ===
          String(user?._id)
      )
    ) {
      people.push(user);
    }
  });

  const visiblePeople = people.slice(0, 4);

  if (!visiblePeople.length) {
    return (
      <div
        className="
          flex h-6 w-6
          items-center justify-center
          rounded-full
          border border-white/[0.08]
          bg-[#1a1b1e]
          text-zinc-600
        "
      >
        <UserRound size={11} />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {visiblePeople.map((user, index) => (
        <div
          key={
            user?._id ||
            user?.id ||
            `${getUserName(user)}-${index}`
          }
          className={
            index !== 0
              ? "-ml-1.5"
              : ""
          }
        >
          <UserAvatar
            user={user}
            index={index}
          />
        </div>
      ))}

      {people.length > 4 && (
        <span
          className="
            -ml-1.5
            flex h-6 w-6
            items-center justify-center
            rounded-full
            border-2 border-[#111214]
            bg-[#242528]
            text-[7px]
            font-semibold
            text-zinc-400
          "
        >
          +{people.length - 4}
        </span>
      )}
    </div>
  );
};

/* =========================================================
   WORKSPACE MENU
========================================================= */

const WorkspaceMenu = ({
  workspace,
  onClose,
  onOpen,
  onDelete,
}) => {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${workspace.name || workspace.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    onDelete();
    onClose();
  };

  const handleAction = (action) => {
    if (action === "Open") {
      onOpen();
      onClose();
      return;
    }

    if (action === "Rename") {
      // Rename will be connected when the
      // workspace edit flow is added here.
      onClose();
      return;
    }

    if (action === "Duplicate") {
      // Duplicate will be connected when
      // workspace duplication is implemented.
      onClose();
      return;
    }
  };

  return (
    <div
      className="
        absolute right-2 top-11 z-30
        w-[150px]
        overflow-hidden
        rounded-lg
        border border-white/[0.08]
        bg-[#18191c]
        shadow-2xl shadow-black/40
      "
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        onClick={() =>
          handleAction("Open")
        }
        className="
          flex w-full items-center gap-2.5
          px-3 py-2.5
          text-left text-[11px]
          text-zinc-300
          transition-colors
          hover:bg-white/[0.05]
          hover:text-white
        "
      >
        <ExternalLink
          size={13}
          className="text-zinc-500"
        />

        Open
      </button>

      <button
        type="button"
        onClick={() =>
          handleAction("Rename")
        }
        className="
          flex w-full items-center gap-2.5
          px-3 py-2.5
          text-left text-[11px]
          text-zinc-300
          transition-colors
          hover:bg-white/[0.05]
          hover:text-white
        "
      >
        <Pencil
          size={13}
          className="text-zinc-500"
        />

        Rename
      </button>

      <button
        type="button"
        onClick={() =>
          handleAction("Duplicate")
        }
        className="
          flex w-full items-center gap-2.5
          px-3 py-2.5
          text-left text-[11px]
          text-zinc-300
          transition-colors
          hover:bg-white/[0.05]
          hover:text-white
        "
      >
        <Copy
          size={13}
          className="text-zinc-500"
        />

        Duplicate
      </button>

      <div className="mx-2 border-t border-white/[0.06]" />

      <button
        type="button"
        onClick={handleDelete}
        className="
          flex w-full items-center gap-2.5
          px-3 py-2.5
          text-left text-[11px]
          text-red-400
          transition-colors
          hover:bg-red-500/[0.06]
          hover:text-red-300
        "
      >
        <Trash2 size={13} />

        Delete
      </button>
    </div>
  );
};

/* =========================================================
   WORKSPACE CARD
========================================================= */

const WorkspaceCard = ({
  workspace,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  onOpen,
  onDelete,
}) => {
  const language = getLanguageInfo(
    workspace.language
  );

  const title =
    workspace.name ||
    workspace.title ||
    "Untitled workspace";

  const description =
    workspace.description ||
    "No description";

  const collaborators =
    getCollaborators(workspace);

  const lastActivity =
    workspace.lastOpenedAt ||
    workspace.updatedAt ||
    workspace.createdAt;

  const isOwner =
    getWorkspaceRole(workspace) ===
    "owner";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onOpen();
        }
      }}
      className="
        group
        relative
        min-h-[156px]
        cursor-pointer
        rounded-xl
        border border-white/[0.075]
        bg-[#111214]
        p-4
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-[#dc9458]/20
        hover:bg-[#141517]
        focus:outline-none
        focus:ring-1
        focus:ring-[#dc9458]/30
      "
    >
      {/* TOP ROW */}

      <div className="flex items-start justify-between">
        <div
          className={`
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            font-mono
            text-[9px]
            font-semibold
            ${language.className}
          `}
        >
          {language.short}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={`More options for ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              onMenuToggle();
            }}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-md
              text-zinc-600
              transition-colors
              hover:bg-white/[0.06]
              hover:text-zinc-300
            "
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <WorkspaceMenu
              workspace={workspace}
              onClose={onMenuClose}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>

      {/* CONTENT */}

      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3
            className="
              truncate
              text-[14px]
              font-semibold
              tracking-[-0.015em]
              text-zinc-200
              transition-colors
              group-hover:text-white
            "
          >
            {title}
          </h3>

          {isOwner && (
            <span
              className="
                shrink-0
                rounded-full
                bg-[#2c231d]
                px-1.5 py-0.5
                text-[7px]
                font-medium
                uppercase
                tracking-wide
                text-[#df9758]
              "
            >
              Owner
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-[11px] text-zinc-600">
          {language.name} ·{" "}
          {collaborators}{" "}
          {collaborators === 1
            ? "member"
            : "members"}
        </p>

        {workspace.description && (
          <p
            className="
              mt-2
              truncate
              text-[10px]
              text-zinc-700
            "
          >
            {description}
          </p>
        )}
      </div>

      {/* BOTTOM */}

      <div className="mt-4 flex items-center justify-between">
        <AvatarStack
          workspace={workspace}
        />

        <span className="text-[10px] text-zinc-600">
          {formatRelativeTime(
            lastActivity
          )}
        </span>
      </div>
    </article>
  );
};

/* =========================================================
   QUICK ACTION
========================================================= */

const QuickAction = ({
  action,
  onClick,
}) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex min-h-[105px]
        flex-col justify-between
        rounded-xl
        border border-white/[0.07]
        bg-[#111214]
        p-4
        text-left
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-[#dc9458]/20
        hover:bg-[#151618]
      "
    >
      <span
        className="
          flex h-9 w-9
          items-center justify-center
          rounded-lg
          bg-[#2c231d]
          text-[#df9758]
          transition-transform duration-200
          group-hover:scale-105
        "
      >
        <Icon
          size={16}
          strokeWidth={1.8}
        />
      </span>

      <div>
        <p className="text-[12px] font-semibold text-zinc-200">
          {action.title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-zinc-600">
          {action.description}
        </p>
      </div>
    </button>
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
  iconClass,
}) => {
  return (
    <div
      className="
        rounded-xl
        border border-white/[0.07]
        bg-[#111214]
        p-4
        transition-all duration-200
        hover:border-white/[0.11]
        hover:bg-[#131416]
      "
    >
      <div className="flex items-center justify-between">
        <Icon
          size={16}
          className={iconClass}
          strokeWidth={1.7}
        />

        <span className="text-[9px] tracking-wide text-zinc-700">
          {label}
        </span>
      </div>

      <p className="mt-4 text-xl font-bold text-zinc-200">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-zinc-600">
        {description}
      </p>
    </div>
  );
};

/* =========================================================
   DASHBOARD PAGE
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();

  /* ================= DATA ================= */

  const {
    data: workspaces = [],
    isLoading,
    isError,
  } = useWorkspaces();

  /* ================= MUTATIONS ================= */

  const createWorkspaceMutation =
    useCreateWorkspace();

  const deleteWorkspaceMutation =
    useDeleteWorkspace();

  /* ================= UI ================= */

  const [openMenu, setOpenMenu] =
    useState(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  /* =========================================================
     DERIVED STATS
  ========================================================= */

  const stats = useMemo(() => {
    const totalCollaborators =
      workspaces.reduce(
        (total, workspace) => {
          return (
            total +
            getCollaborators(workspace)
          );
        },
        0
      );

    return {
      total: workspaces.length,
      active: workspaces.length,
      collaborators:
        totalCollaborators,
    };
  }, [workspaces]);

  /* =========================================================
     OPEN WORKSPACE
  ========================================================= */

  const handleOpenWorkspace = (
    workspaceId
  ) => {
    if (!workspaceId) return;

    navigate(
      `/workspace/${workspaceId}`
    );
  };

  /* =========================================================
     CREATE WORKSPACE
  ========================================================= */

  const handleWorkspaceCreated = async (
    workspaceData
  ) => {
    try {
      const workspace =
        await createWorkspaceMutation.mutateAsync(
          workspaceData
        );

      setShowCreateModal(false);

      if (workspace?._id) {
        navigate(
          `/workspace/${workspace._id}`
        );
      }
    } catch (error) {
      console.error(
        "Failed to create workspace:",
        error
      );
    }
  };

  /* =========================================================
     DELETE WORKSPACE
  ========================================================= */

  const handleDeleteWorkspace = async (
    workspace
  ) => {
    if (!workspace?._id) return;

    try {
      await deleteWorkspaceMutation.mutateAsync(
        workspace._id
      );
    } catch (error) {
      console.error(
        "Failed to delete workspace:",
        error
      );
    }
  };

  /* =========================================================
     CLOSE MENU
  ========================================================= */

  const handleMenuClose = () => {
    setOpenMenu(null);
  };

  /* =========================================================
     QUICK ACTIONS
  ========================================================= */

  const handleQuickAction = (
    action
  ) => {
    if (action === "shared") {
      navigate("/shared-with-me");
      return;
    }

    if (action === "recent") {
      navigate("/workspaces");
      return;
    }

    if (action === "activity") {
      return;
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

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
            flex min-h-screen
            items-center justify-center
          "
        >
          <div className="flex items-center gap-2.5 text-zinc-500">
            <LoaderCircle
              size={17}
              className="animate-spin"
            />

            <span className="text-[12px]">
              Loading your workspaces...
            </span>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (isError) {
    return (
      <main
        className="
          min-h-screen
          bg-[#090a0b]
          px-4
          pt-[100px]
          text-zinc-100
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-[1280px]">
          <div
            className="
              rounded-xl
              border border-red-500/10
              bg-[#111214]
              p-6
            "
          >
            <p className="text-[13px] font-semibold text-zinc-200">
              Couldn't load your workspaces
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
              Please refresh the page and try
              again.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        className="
          min-h-screen
          bg-[#090a0b]
          text-zinc-100
        "
        onClick={handleMenuClose}
      >
        <div
          className="
            px-4
            pb-12
            pt-[100px]
            sm:px-6
            lg:px-8
          "
        >
          <div className="mx-auto max-w-[1280px]">

            {/* =================================================
                HEADER
            ================================================= */}

            <section className="mb-9">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="
                      h-1.5 w-1.5
                      rounded-full
                      bg-emerald-400
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
                    Workspace
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
                  Your development space
                </h1>

                <p className="mt-1.5 text-[13px] text-zinc-600">
                  Continue building where you
                  left off.
                </p>
              </div>
            </section>

            {/* =================================================
                STATS
            ================================================= */}

            <section
              className="
                mb-10
                grid
                grid-cols-2
                gap-3
                lg:grid-cols-4
              "
            >
              <StatCard
                icon={FolderKanban}
                label="TOTAL"
                value={stats.total}
                description="Workspaces"
                iconClass="text-[#dc9458]"
              />

              <StatCard
                icon={Code2}
                label="ACTIVE"
                value={stats.active}
                description="Available projects"
                iconClass="text-[#73a8e9]"
              />

              <StatCard
                icon={Users}
                label="TEAM"
                value={stats.collaborators}
                description="Workspace members"
                iconClass="text-[#a67adb]"
              />

              <StatCard
                icon={Clock3}
                label="RECENT"
                value={
                  workspaces.length
                    ? Math.min(
                        workspaces.length,
                        5
                      )
                    : 0
                }
                description="Recent projects"
                iconClass="text-emerald-400"
              />
            </section>

            {/* =================================================
                RECENT WORKSPACES
            ================================================= */}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-zinc-200">
                    Recent workspaces
                  </h2>

                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    Your latest projects
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(true)
                  }
                  className="
                    flex items-center gap-1
                    text-[11px]
                    text-[#df9758]
                    transition-colors
                    hover:text-[#eca267]
                  "
                >
                  Create

                  <ArrowUpRight size={12} />
                </button>
              </div>

              {workspaces.length === 0 ? (
                <div
                  className="
                    flex min-h-[190px]
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border border-dashed
                    border-white/[0.08]
                    bg-[#111214]
                    text-center
                  "
                >
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-[#2c231d]
                      text-[#df9758]
                    "
                  >
                    <FolderKanban size={17} />
                  </div>

                  <p className="mt-3 text-[12px] font-semibold text-zinc-300">
                    No workspaces yet
                  </p>

                  <p className="mt-1 max-w-[280px] text-[10px] leading-4 text-zinc-600">
                    Create your first workspace
                    and start building.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateModal(true)
                    }
                    className="
                      mt-4
                      rounded-md
                      bg-[#dc9458]
                      px-3
                      py-2
                      text-[10px]
                      font-semibold
                      text-[#17110d]
                      transition-colors
                      hover:bg-[#eca267]
                    "
                  >
                    Create workspace
                  </button>
                </div>
              ) : (
                <div
                  className="
                    grid
                    gap-3
                    sm:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {workspaces.map(
                    (workspace) => (
                      <WorkspaceCard
                        key={workspace._id}
                        workspace={workspace}
                        menuOpen={
                          openMenu ===
                          workspace._id
                        }
                        onMenuToggle={() =>
                          setOpenMenu(
                            (current) =>
                              current ===
                              workspace._id
                                ? null
                                : workspace._id
                          )
                        }
                        onMenuClose={
                          handleMenuClose
                        }
                        onOpen={() =>
                          handleOpenWorkspace(
                            workspace._id
                          )
                        }
                        onDelete={() =>
                          handleDeleteWorkspace(
                            workspace
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="mt-11">
              <div className="mb-3">
                <h2 className="text-[14px] font-semibold text-zinc-200">
                  Quick actions
                </h2>

                <p className="mt-0.5 text-[10px] text-zinc-700">
                  Jump into your workspace
                </p>
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-3
                "
              >
                <QuickAction
                  action={{
                    title: "Shared With Me",
                    description:
                      "Projects shared with you",
                    icon: UserRound,
                  }}
                  onClick={() =>
                    handleQuickAction(
                      "shared"
                    )
                  }
                />

                <QuickAction
                  action={{
                    title: "All Workspaces",
                    description:
                      "Browse your projects",
                    icon: FileText,
                  }}
                  onClick={() =>
                    handleQuickAction(
                      "recent"
                    )
                  }
                />

                <QuickAction
                  action={{
                    title: "Activity",
                    description:
                      "Workspace activity",
                    icon: Activity,
                  }}
                  onClick={() =>
                    handleQuickAction(
                      "activity"
                    )
                  }
                />
              </div>
            </section>

            {/* =================================================
                ACTIVITY
            ================================================= */}

            <section className="mt-11">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-zinc-200">
                    Workspace activity
                  </h2>

                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    Your latest workspace changes
                  </p>
                </div>
              </div>

              {workspaces.length === 0 ? (
                <div
                  className="
                    rounded-xl
                    border border-white/[0.07]
                    bg-[#111214]
                    px-4
                    py-8
                    text-center
                  "
                >
                  <Activity
                    size={18}
                    className="mx-auto text-zinc-700"
                  />

                  <p className="mt-2 text-[11px] text-zinc-600">
                    Activity will appear here
                    as you work.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    overflow-hidden
                    rounded-xl
                    border border-white/[0.07]
                    bg-[#111214]
                  "
                >
                  {workspaces
                    .slice(0, 5)
                    .map(
                      (
                        workspace,
                        index
                      ) => {
                        const title =
                          workspace.name ||
                          workspace.title ||
                          "Untitled workspace";

                        const time =
                          workspace.lastOpenedAt ||
                          workspace.updatedAt ||
                          workspace.createdAt;

                        return (
                          <div
                            key={
                              workspace._id
                            }
                            className={`
                              flex items-center gap-3
                              px-4 py-3.5
                              transition-colors
                              hover:bg-white/[0.015]

                              ${
                                index !==
                                Math.min(
                                  workspaces.length,
                                  5
                                ) - 1
                                  ? "border-b border-white/[0.045]"
                                  : ""
                              }
                            `}
                          >
                            <span
                              className="
                                h-2 w-2
                                shrink-0
                                rounded-full
                                bg-[#df9758]
                              "
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] text-zinc-300">
                                {title}
                              </p>

                              <p className="mt-0.5 text-[9px] text-zinc-700">
                                Workspace
                              </p>
                            </div>

                            <span className="shrink-0 text-[9px] text-zinc-600">
                              {formatRelativeTime(
                                time
                              )}
                            </span>
                          </div>
                        );
                      }
                    )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* =====================================================
          CREATE WORKSPACE MODAL
      ===================================================== */}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onCreate={
          handleWorkspaceCreated
        }
      />

      {createWorkspaceMutation.isPending && (
        <div
          className="
            fixed
            bottom-5
            right-5
            z-50
            flex
            items-center
            gap-2
            rounded-lg
            border border-white/[0.08]
            bg-[#18191c]
            px-3
            py-2.5
            shadow-xl
          "
        >
          <LoaderCircle
            size={13}
            className="
              animate-spin
              text-[#df9758]
            "
          />

          <span className="text-[10px] text-zinc-400">
            Creating workspace...
          </span>
        </div>
      )}
    </>
  );
};

export default DashboardPage;