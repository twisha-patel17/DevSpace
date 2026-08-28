import { useState } from "react";
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
} from "lucide-react";

import CreateWorkspaceModal from "../components/CreateWorkspaceModal";

const initialWorkspaces = [
  {
    id: 1,
    language: "JS",
    languageName: "JavaScript",
    languageColor: "bg-[#302f1c] text-[#e5c82d]",
    title: "Portfolio",
    description: "Personal portfolio website",
    collaborators: 3,
    avatars: ["TP", "RK", "PS"],
    time: "12m ago",
    status: "Active",
  },
  {
    id: 2,
    language: "C++",
    languageName: "C++",
    languageColor: "bg-[#1c2638] text-[#72a4e2]",
    title: "DSA Practice",
    description: "Algorithms and data structures",
    collaborators: 1,
    avatars: ["TP"],
    time: "Yesterday",
    status: "Active",
  },
  {
    id: 3,
    language: "PY",
    languageName: "Python",
    languageColor: "bg-[#1c3029] text-[#65bc8d]",
    title: "Quest API",
    description: "Backend API development",
    collaborators: 2,
    avatars: ["TP", "PS"],
    time: "3 days ago",
    status: "Offline",
  },
];

const quickActions = [
  {
    title: "Shared With Me",
    description: "Projects shared with you",
    icon: UserRound,
  },
  {
    title: "Recent Files",
    description: "Continue where you left off",
    icon: FileText,
  },
  {
    title: "Activity",
    description: "See recent workspace activity",
    icon: Activity,
  },
];

const activities = [
  {
    text: "Rahul joined Portfolio",
    workspace: "Portfolio",
    time: "10:42 AM",
    dot: "bg-[#73a8e9]",
  },
  {
    text: "You edited App.jsx",
    workspace: "Portfolio",
    time: "10:18 AM",
    dot: "bg-[#df9758]",
  },
  {
    text: "Priya created Navbar.jsx",
    workspace: "Quest API",
    time: "9:51 AM",
    dot: "bg-[#a67adb]",
  },
  {
    text: "You created a new workspace",
    workspace: "DSA Practice",
    time: "Yesterday",
    dot: "bg-emerald-400",
  },
];

/* =========================================================
   AVATAR STACK
========================================================= */

const AvatarStack = ({ avatars }) => {
  const styles = [
    "bg-[#df9758] text-[#17110d]",
    "bg-[#73a8e9] text-[#111214]",
    "bg-[#a67adb] text-[#111214]",
  ];

  return (
    <div className="flex items-center">
      {avatars.map((avatar, index) => (
        <span
          key={`${avatar}-${index}`}
          className={`
            ${index !== 0 ? "-ml-1.5" : ""}
            flex h-6 w-6
            items-center justify-center
            rounded-full
            border-2 border-[#111214]
            text-[7px]
            font-bold
            ${styles[index % styles.length]}
          `}
        >
          {avatar}
        </span>
      ))}
    </div>
  );
};

/* =========================================================
   WORKSPACE MENU
========================================================= */

const WorkspaceMenu = ({
  workspace,
  onClose,
}) => {
  const handleAction = (action) => {
    console.log(`${action}:`, workspace.title);
    onClose();
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
      onClick={(e) =>
        e.stopPropagation()
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
        onClick={() =>
          handleAction("Delete")
        }
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
}) => {
  return (
    <article
      className="
        relative
        min-h-[156px]
        rounded-xl
        border border-white/[0.075]
        bg-[#111214]
        p-4
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-white/[0.13]
        hover:bg-[#141517]
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
            ${workspace.languageColor}
          `}
        >
          {workspace.language}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={`More options for ${workspace.title}`}
            onClick={(e) => {
              e.stopPropagation();
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
            "
          >
            {workspace.title}
          </h3>

          {workspace.status === "Active" && (
            <span
              className="
                h-1.5 w-1.5
                shrink-0
                rounded-full
                bg-emerald-400
                shadow-[0_0_6px_rgba(52,211,153,0.35)]
              "
            />
          )}
        </div>

        <p className="mt-1 truncate text-[11px] text-zinc-600">
          {workspace.languageName} ·{" "}
          {workspace.collaborators}{" "}
          {workspace.collaborators === 1
            ? "collaborator"
            : "collaborators"}
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
            {workspace.description}
          </p>
        )}
      </div>

      {/* BOTTOM */}

      <div className="mt-4 flex items-center justify-between">
        <AvatarStack
          avatars={workspace.avatars}
        />

        <span className="text-[10px] text-zinc-600">
          {workspace.time}
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
}) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
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

  /* ================= WORKSPACES ================= */

  const [workspaces, setWorkspaces] =
    useState(initialWorkspaces);

  /* ================= MENU ================= */

  const [openMenu, setOpenMenu] =
    useState(null);

  /* ================= MODAL ================= */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  /* =========================================================
     OPEN CREATE WORKSPACE MODAL
  ========================================================= */

  const handleOpenCreateWorkspace = () => {
    setShowCreateModal(true);
  };

  /* =========================================================
     CLOSE CREATE WORKSPACE MODAL
  ========================================================= */

  const handleCloseCreateWorkspace = () => {
    setShowCreateModal(false);
  };

  /* =========================================================
     CREATE WORKSPACE
  ========================================================= */

  const handleWorkspaceCreated = (
    workspaceData
  ) => {
    const newWorkspace = {
      ...workspaceData,

      id: Date.now(),

      collaborators: 1,

      avatars: ["TP"],

      time: "Just now",

      status: "Active",
    };

    setWorkspaces((current) => [
      newWorkspace,
      ...current,
    ]);

    setShowCreateModal(false);
  };

  /* =========================================================
     MENU HANDLERS
  ========================================================= */

  const handleMenuToggle = (id) => {
    setOpenMenu((current) =>
      current === id ? null : id
    );
  };

  const handleMenuClose = () => {
    setOpenMenu(null);
  };

  return (
    <>
      {/* =====================================================
          DASHBOARD
      ===================================================== */}

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
                  Good afternoon, Twisha
                </h1>

                <p className="mt-1.5 text-[13px] text-zinc-600">
                  Continue building where you left off.
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
                value={workspaces.length}
                description="Workspaces"
                iconClass="text-[#dc9458]"
              />

              <StatCard
                icon={Code2}
                label="ACTIVE"
                value={
                  workspaces.filter(
                    (workspace) =>
                      workspace.status ===
                      "Active"
                  ).length
                }
                description="Active projects"
                iconClass="text-[#73a8e9]"
              />

              <StatCard
                icon={Users}
                label="TEAM"
                value="4"
                description="Collaborators"
                iconClass="text-[#a67adb]"
              />

              <StatCard
                icon={Clock3}
                label="TODAY"
                value="12"
                description="Files edited"
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
                  onClick={
                    handleOpenCreateWorkspace
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
                      key={workspace.id}
                      workspace={workspace}
                      menuOpen={
                        openMenu ===
                        workspace.id
                      }
                      onMenuToggle={() =>
                        handleMenuToggle(
                          workspace.id
                        )
                      }
                      onMenuClose={
                        handleMenuClose
                      }
                    />
                  )
                )}
              </div>
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
                {quickActions.map(
                  (action) => (
                    <QuickAction
                      key={action.title}
                      action={action}
                    />
                  )
                )}
              </div>
            </section>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <section className="mt-11">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-zinc-200">
                    Recent activity
                  </h2>

                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    What's happening in your workspaces
                  </p>
                </div>

                <button
                  type="button"
                  className="
                    flex items-center gap-1
                    text-[11px]
                    text-[#df9758]
                    transition-colors
                    hover:text-[#eca267]
                  "
                >
                  View all

                  <ArrowUpRight size={12} />
                </button>
              </div>

              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border border-white/[0.07]
                  bg-[#111214]
                "
              >
                {activities.map(
                  (activity, index) => (
                    <div
                      key={`${activity.text}-${index}`}
                      className={`
                        flex items-center gap-3
                        px-4 py-3.5
                        transition-colors
                        hover:bg-white/[0.015]

                        ${
                          index !==
                          activities.length - 1
                            ? "border-b border-white/[0.045]"
                            : ""
                        }
                      `}
                    >
                      <span
                        className={`
                          h-2 w-2
                          shrink-0
                          rounded-full
                          ${activity.dot}
                        `}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-zinc-300">
                          {activity.text}
                        </p>

                        <p className="mt-0.5 text-[9px] text-zinc-700">
                          {activity.workspace}
                        </p>
                      </div>

                      <span className="shrink-0 text-[9px] text-zinc-600">
                        {activity.time}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* =====================================================
          CREATE WORKSPACE MODAL
      ===================================================== */}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={
          handleCloseCreateWorkspace
        }
        onCreate={
          handleWorkspaceCreated
        }
      />
    </>
  );
};

export default DashboardPage;