import { useMemo, useState } from "react";
import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  FolderKanban,
  Users,
  Clock3,
  Code2,
  MoreVertical,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  Check,
} from "lucide-react";

import api from "../api/axios";
import useAuthStore from "../store/authStore";

const AvatarStack = ({ count }) => {
  const avatars = ["TP", "RK", "PS", "AM"];

  const avatarStyles = [
    "bg-[#df9758] text-[#17110d]",
    "bg-[#73a8e9] text-[#111214]",
    "bg-[#a67adb] text-[#111214]",
    "bg-[#65bc8d] text-[#111214]",
  ];

  return (
    <div className="flex items-center">
      {avatars
        .slice(0, Math.min(count, 4))
        .map((avatar, index) => (
          <span
            key={`${avatar}-${index}`}
            className={`
              flex h-6 w-6
              items-center justify-center
              rounded-full
              border-2 border-[#111214]
              text-[7px] font-bold
              ${index !== 0 ? "-ml-1.5" : ""}
              ${avatarStyles[index]}
            `}
          >
            {avatar}
          </span>
        ))}

      {count > 4 && (
        <span
          className="
            -ml-1.5
            flex h-6 w-6
            items-center justify-center
            rounded-full
            border-2 border-[#111214]
            bg-[#252629]
            text-[7px] font-semibold
            text-zinc-400
          "
        >
          +{count - 4}
        </span>
      )}
    </div>
  );
};

const getLanguageStyle = (language = "") => {
  const value = language.toLowerCase();

  if (value.includes("javascript")) {
    return "bg-[#302f1c] text-[#e5c82d]";
  }

  if (value.includes("typescript")) {
    return "bg-[#1c2638] text-[#72a4e2]";
  }

  if (value.includes("react")) {
    return "bg-[#202c30] text-[#63c5d8]";
  }

  if (value.includes("python")) {
    return "bg-[#1c3029] text-[#65bc8d]";
  }

  if (value.includes("c++")) {
    return "bg-[#25203a] text-[#a67adb]";
  }

  if (value.includes("node")) {
    return "bg-[#24301f] text-[#8bcf65]";
  }

  return "bg-[#252629] text-zinc-300";
};

const getLanguageShort = (language = "") => {
  const value = language.toLowerCase();

  if (value.includes("javascript")) return "JS";
  if (value.includes("typescript")) return "TS";
  if (value.includes("react")) return "RE";
  if (value.includes("python")) return "PY";
  if (value.includes("c++")) return "C++";
  if (value.includes("node")) return "JS";

  return language.slice(0, 2).toUpperCase() || "BL";
};

const WorkspaceMenu = ({
  workspace,
  onClose,
  onDelete,
}) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/workspaces/${workspace._id}`);
    onClose();
  };

  const handleDelete = () => {
    onDelete(workspace._id);
    onClose();
  };

  return (
    <div
      className="
        absolute right-0 top-9 z-30
        w-[155px]
        overflow-hidden
        rounded-lg
        border border-white/[0.08]
        bg-[#18191c]
        shadow-2xl shadow-black/40
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* OPEN */}

      <button
        type="button"
        onClick={handleOpen}
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

      {/* RENAME */}

      <button
        type="button"
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

      {/* DUPLICATE */}

      <button
        type="button"
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

      {/* DELETE */}

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

const WorkspaceCard = ({
  workspace,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  onDelete,
}) => {
  const navigate = useNavigate();

  const language =
    workspace.language ||
    workspace.languageName ||
    "Blank";

  const languageShort =
    workspace.languageShort ||
    getLanguageShort(language);

  const languageClass =
    workspace.languageColor ||
    getLanguageStyle(language);

  const collaborators =
    workspace.members?.length ||
    workspace.collaborators ||
    1;

  const status =
    workspace.status ||
    "Active";

  const openWorkspace = () => {
    navigate(`/workspaces/${workspace._id}`);
  };

  return (
    <article
      className="
        group
        relative
        flex min-h-[220px]
        flex-col
        rounded-xl
        border border-white/[0.075]
        bg-[#111214]
        p-5
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-white/[0.13]
        hover:bg-[#141517]
      "
    >
      {/* TOP */}

      <div className="flex items-start justify-between">
        <div
          className={`
            flex h-10 w-10
            items-center justify-center
            rounded-lg
            font-mono
            text-[9px]
            font-semibold
            ${languageClass}
          `}
        >
          {languageShort}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={`More options for ${workspace.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="
              flex h-8 w-8
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
              onDelete={onDelete}
            />
          )}
        </div>
      </div>

      {/* CONTENT */}

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <h3
            className="
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
            className={`
              h-1.5 w-1.5
              shrink-0
              rounded-full
              ${
                status === "Active"
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.35)]"
                  : "bg-zinc-700"
              }
            `}
          />
        </div>

        <p
          className="
            mt-1.5
            min-h-[32px]
            text-[11px]
            leading-4
            text-zinc-600
          "
        >
          {workspace.description ||
            "No description"}
        </p>
      </div>

      {/* DETAILS */}

      <div className="mt-auto pt-5">
        <div
          className="
            flex items-center
            justify-between
            border-t border-white/[0.05]
            pt-4
          "
        >
          <div className="flex items-center gap-2">
            <AvatarStack count={collaborators} />

            <span className="text-[10px] text-zinc-600">
              {collaborators}{" "}
              {collaborators === 1
                ? "member"
                : "members"}
            </span>
          </div>

          <span
            className="
              flex items-center gap-1
              text-[9px] text-zinc-700
            "
          >
            <Clock3 size={11} />

            {workspace.lastOpened ||
              "Recently"}
          </span>
        </div>

        {/* OPEN */}

        <button
          type="button"
          onClick={openWorkspace}
          className="
            mt-4
            flex h-9 w-full
            items-center justify-center
            gap-1.5
            rounded-lg
            border border-white/[0.07]
            bg-white/[0.02]
            text-[10px]
            font-medium
            text-zinc-400
            transition-all duration-200
            hover:border-[#dc9458]/25
            hover:bg-[#dc9458]/[0.07]
            hover:text-[#dc9458]
          "
        >
          Open Workspace

          <ExternalLink size={12} />
        </button>
      </div>
    </article>
  );
};

const WorkspacesPage = () => {
  
  const {
    openCreateWorkspace,
  } = useOutletContext();

  const queryClient =
    useQueryClient();

  const accessToken =
    useAuthStore(
      (state) => state.accessToken
    );

  const [search, setSearch] =
    useState("");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [filter, setFilter] =
    useState("All");

  const [openMenu, setOpenMenu] =
    useState(null);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["workspaces"],

    queryFn: async () => {
      const response =
        await api.get(
          "/api/workspaces",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

      return response.data.workspaces;
    },

    enabled: !!accessToken,
  });

  const workspaces = data || [];

  const deleteMutation =
    useMutation({
      mutationFn: async (workspaceId) => {
        await api.delete(
          `/api/workspaces/${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["workspaces"],
        });
      },

      onError: (error) => {
        console.error(
          "Delete workspace error:",
          error
        );
      },
    });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const filteredWorkspaces =
    useMemo(() => {
      return workspaces.filter(
        (workspace) => {
          const searchValue =
            search
              .toLowerCase()
              .trim();

          const name =
            workspace.name ||
            "";

          const description =
            workspace.description ||
            "";

          const language =
            workspace.language ||
            workspace.languageName ||
            "";

          const matchesSearch =
            name
              .toLowerCase()
              .includes(searchValue) ||
            description
              .toLowerCase()
              .includes(searchValue) ||
            language
              .toLowerCase()
              .includes(searchValue);

          const status =
            workspace.status ||
            "Active";

          const matchesFilter =
            filter === "All" ||
            status === filter ||
            language === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      workspaces,
      search,
      filter,
    ]);

  const totalWorkspaces =
    workspaces.length;

  const activeWorkspaces =
    workspaces.filter(
      (workspace) =>
        (workspace.status ||
          "Active") === "Active"
    ).length;

  const totalMembers =
    workspaces.reduce(
      (total, workspace) =>
        total +
        (workspace.members?.length ||
          workspace.collaborators ||
          1),
      0
    );

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
            px-4 pb-14
            pt-[100px]
            sm:px-6
            lg:px-8
          "
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-8">
              <div className="h-3 w-28 animate-pulse rounded bg-white/[0.05]" />

              <div className="mt-3 h-8 w-40 animate-pulse rounded bg-white/[0.05]" />

              <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/[0.04]" />
            </div>

            <div
              className="
                grid
                gap-3
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-[220px]
                      animate-pulse
                      rounded-xl
                      border border-white/[0.05]
                      bg-[#111214]
                    "
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

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
            flex min-h-screen
            items-center
            justify-center
            px-6
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto flex h-11 w-11
                items-center justify-center
                rounded-xl
                bg-red-500/[0.08]
                text-red-400
              "
            >
              !
            </div>

            <h2
              className="
                mt-4
                text-[14px]
                font-semibold
                text-zinc-200
              "
            >
              Failed to load workspaces
            </h2>

            <p
              className="
                mt-1
                text-[10px]
                text-zinc-600
              "
            >
              {error?.response?.data?.message ||
                "Something went wrong"}
            </p>

            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["workspaces"],
                })
              }
              className="
                mt-4
                text-[10px]
                font-medium
                text-[#dc9458]
                hover:text-[#e5a067]
              "
            >
              Try again
            </button>
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
      onClick={() => {
        setOpenMenu(null);
        setFilterOpen(false);
      }}
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
        <div className="mx-auto max-w-[1280px]">

          <section
            className="
              mb-8
              flex flex-col
              gap-5
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
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
                  Developer Space
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
                Workspaces
              </h1>

              <p
                className="
                  mt-1.5
                  text-[13px]
                  text-zinc-600
                "
              >
                Manage and open your collaborative
                coding projects.
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateWorkspace();
              }}
              className="
                flex h-10
                w-full
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#dc9458]
                px-4
                text-[11px]
                font-semibold
                text-[#17110d]
                shadow-[0_4px_20px_rgba(220,148,88,0.08)]
                transition-all duration-200
                hover:bg-[#e5a067]
                hover:shadow-[0_5px_25px_rgba(220,148,88,0.13)]
                active:scale-[0.98]
                sm:w-auto
              "
            >
              <Plus
                size={14}
                strokeWidth={2.5}
              />

              <span>
                New Workspace
              </span>
            </button>
          </section>

          <section
            className="
              mb-8
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >
            
            <div
              className="
                rounded-xl
                border border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div className="flex items-center justify-between">
                <FolderKanban
                  size={16}
                  className="text-[#dc9458]"
                />

                <span className="text-[9px] text-zinc-700">
                  TOTAL
                </span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {totalWorkspaces}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                All workspaces
              </p>
            </div>

            <div
              className="
                rounded-xl
                border border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div className="flex items-center justify-between">
                <Code2
                  size={16}
                  className="text-[#73a8e9]"
                />

                <span className="text-[9px] text-zinc-700">
                  ACTIVE
                </span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {activeWorkspaces}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Currently active
              </p>
            </div>

            {/* MEMBERS */}

            <div
              className="
                rounded-xl
                border border-white/[0.07]
                bg-[#111214]
                p-4
              "
            >
              <div className="flex items-center justify-between">
                <Users
                  size={16}
                  className="text-[#a67adb]"
                />

                <span className="text-[9px] text-zinc-700">
                  MEMBERS
                </span>
              </div>

              <p className="mt-4 text-xl font-bold text-zinc-200">
                {totalMembers}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Across workspaces
              </p>
            </div>
          </section>

          <section className="mb-6">
            <div
              className="
                flex flex-col
                gap-3
                sm:flex-row
              "
            >
              {/* SEARCH */}

              <div className="group relative flex-1">
                <Search
                  size={15}
                  strokeWidth={1.8}
                  className="
                    pointer-events-none
                    absolute left-3.5 top-1/2
                    -translate-y-1/2
                    text-zinc-600
                    transition-colors
                    group-focus-within:text-[#dc9458]
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                  placeholder="Search workspaces..."
                  className="
                    h-10 w-full
                    rounded-lg
                    border border-white/[0.07]
                    bg-[#111214]
                    pl-10 pr-4
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

              {/* FILTER */}

              <div className="relative sm:w-[180px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    setFilterOpen(
                      (current) => !current
                    );
                  }}
                  className={`
                    flex h-10 w-full
                    items-center justify-between
                    rounded-lg
                    border
                    px-3.5
                    text-[11px]
                    transition-all duration-200

                    ${
                      filterOpen
                        ? "border-[#dc9458]/30 bg-[#151312] text-zinc-200 ring-4 ring-[#dc9458]/[0.04]"
                        : "border-white/[0.07] bg-[#111214] text-zinc-400 hover:border-white/[0.12] hover:bg-[#141517] hover:text-zinc-200"
                    }
                  `}
                >
                  <span className="flex items-center gap-2.5">
                    <SlidersHorizontal
                      size={14}
                      className={
                        filterOpen
                          ? "text-[#dc9458]"
                          : "text-zinc-600"
                      }
                    />

                    <span>
                      {filter === "All"
                        ? "All workspaces"
                        : filter}
                    </span>
                  </span>

                  <ChevronDown
                    size={14}
                    className={`
                      transition-transform duration-200
                      ${
                        filterOpen
                          ? "rotate-180 text-[#dc9458]"
                          : "text-zinc-600"
                      }
                    `}
                  />
                </button>

                {/* DROPDOWN */}

                {filterOpen && (
                  <div
                    className="
                      absolute right-0 top-[46px] z-40
                      w-full
                      overflow-hidden
                      rounded-xl
                      border border-white/[0.08]
                      bg-[#17181a]
                      p-1.5
                      shadow-[0_20px_50px_rgba(0,0,0,0.45)]
                    "
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <div className="px-2.5 pb-1.5 pt-1">
                      <p
                        className="
                          text-[8px]
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-zinc-700
                        "
                      >
                        Filter by
                      </p>
                    </div>

                    {[
                      {
                        label: "All workspaces",
                        value: "All",
                      },
                      {
                        label: "Active",
                        value: "Active",
                      },
                      {
                        label: "Offline",
                        value: "Offline",
                      },
                      {
                        label: "JavaScript",
                        value: "JavaScript",
                      },
                      {
                        label: "C++",
                        value: "C++",
                      },
                      {
                        label: "Python",
                        value: "Python",
                      },
                      {
                        label: "React",
                        value: "React",
                      },
                      {
                        label: "Node.js",
                        value: "Node.js",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFilter(
                            option.value
                          );

                          setFilterOpen(false);
                        }}
                        className={`
                          flex w-full
                          items-center justify-between
                          rounded-lg
                          px-2.5 py-2
                          text-left
                          text-[10px]
                          transition-all duration-150

                          ${
                            filter ===
                            option.value
                              ? "bg-[#dc9458]/[0.10] text-[#dc9458]"
                              : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                          }
                        `}
                      >
                        <span>
                          {option.label}
                        </span>

                        {filter ===
                          option.value && (
                          <Check
                            size={12}
                            strokeWidth={2.5}
                            className="text-[#dc9458]"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RESULT COUNT */}

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-zinc-700">
                {filteredWorkspaces.length}{" "}
                {filteredWorkspaces.length ===
                1
                  ? "workspace"
                  : "workspaces"}
              </p>

              {(search ||
                filter !== "All") && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    setSearch("");
                    setFilter("All");
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

          {filteredWorkspaces.length >
          0 ? (
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
                  <WorkspaceCard
                    key={workspace._id}
                    workspace={workspace}
                    menuOpen={
                      openMenu ===
                      workspace._id
                    }
                    onMenuToggle={() =>
                      setOpenMenu(
                        openMenu ===
                          workspace._id
                          ? null
                          : workspace._id
                      )
                    }
                    onMenuClose={() =>
                      setOpenMenu(null)
                    }
                    onDelete={
                      handleDelete
                    }
                  />
                )
              )}
            </section>
          ) : (
          
            <section
              className="
                flex min-h-[300px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border border-dashed
                border-white/[0.08]
                bg-[#111214]
                px-6
                text-center
              "
            >
              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#2c231d]
                  text-[#dc9458]
                "
              >
                <Search size={18} />
              </div>

              <h3
                className="
                  mt-4
                  text-[13px]
                  font-semibold
                  text-zinc-300
                "
              >
                {search ||
                filter !== "All"
                  ? "No workspaces found"
                  : "No workspaces yet"}
              </h3>

              <p
                className="
                  mt-1
                  max-w-[280px]
                  text-[10px]
                  leading-4
                  text-zinc-600
                "
              >
                {search ||
                filter !== "All"
                  ? "Try changing your search or filters."
                  : "Create your first workspace and start coding."}
              </p>

              {search ||
              filter !== "All" ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    setSearch("");
                    setFilter("All");
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
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateWorkspace();
                  }}
                  className="
                    mt-4
                    flex h-9
                    items-center gap-2
                    rounded-lg
                    bg-[#dc9458]
                    px-4
                    text-[10px]
                    font-semibold
                    text-[#17110d]
                    transition-colors
                    hover:bg-[#e5a067]
                  "
                >
                  <Plus size={13} />

                  Create Workspace
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default WorkspacesPage;