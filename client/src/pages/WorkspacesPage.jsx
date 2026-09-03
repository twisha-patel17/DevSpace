import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  X,
} from "lucide-react";

import {
  useWorkspaces,
  useCreateWorkspace,
  useDeleteWorkspace,
} from "../lib/workspace.queries";

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

const templateLanguageMap = {
  blank: "Blank",
  javascript: "JavaScript",
  react: "React",
  python: "Python",
  cpp: "C++",
};

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

const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    template: "blank",
    language: "Blank",
    visibility: "private",
  });

  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => {
     
      if (name === "template") {
        return {
          ...current,
          template: value,
          language:
            templateLanguageMap[value] || "Blank",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Workspace name is required.");
      return;
    }

    try {
      await onCreate({
        title: formData.title.trim(),
        description: formData.description.trim(),
        template: formData.template,
        language: formData.language,
        visibility: formData.visibility,
      });

      setFormData({
        title: "",
        description: "",
        template: "blank",
        language: "Blank",
        visibility: "private",
      });

      setError("");
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to create workspace."
      );
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/70
        px-4
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-[480px]
          overflow-hidden
          rounded-2xl
          border border-white/[0.08]
          bg-[#111214]
          shadow-[0_25px_80px_rgba(0,0,0,0.55)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div
          className="
            flex items-start justify-between
            border-b border-white/[0.06]
            px-5 py-4
          "
        >
          <div>
            <h2
              className="
                text-[15px]
                font-semibold
                tracking-[-0.02em]
                text-zinc-100
              "
            >
              New Workspace
            </h2>

            <p
              className="
                mt-1
                text-[10px]
                text-zinc-600
              "
            >
              Create a new collaborative coding workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            <X size={15} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            {/* NAME */}

            <div>
              <label
                className="
                  mb-1.5 block
                  text-[10px]
                  font-medium
                  text-zinc-400
                "
              >
                Workspace name
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. DevSpace"
                autoFocus
                className="
                  h-10 w-full
                  rounded-lg
                  border border-white/[0.08]
                  bg-[#0b0c0d]
                  px-3
                  text-[11px]
                  text-zinc-200
                  outline-none
                  placeholder:text-zinc-700
                  transition-all
                  focus:border-[#dc9458]/40
                  focus:ring-4
                  focus:ring-[#dc9458]/[0.04]
                "
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label
                className="
                  mb-1.5 block
                  text-[10px]
                  font-medium
                  text-zinc-400
                "
              >
                Description

                <span className="ml-1 text-zinc-700">
                  (optional)
                </span>
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What are you building?"
                rows={3}
                className="
                  w-full
                  resize-none
                  rounded-lg
                  border border-white/[0.08]
                  bg-[#0b0c0d]
                  px-3 py-2.5
                  text-[11px]
                  leading-4
                  text-zinc-200
                  outline-none
                  placeholder:text-zinc-700
                  transition-all
                  focus:border-[#dc9458]/40
                  focus:ring-4
                  focus:ring-[#dc9458]/[0.04]
                "
              />
            </div>

            {/* LANGUAGE + VISIBILITY */}

            <div
              className="
                grid grid-cols-1
                gap-3
                sm:grid-cols-2
              "
            >
              {/* LANGUAGE */}

              <div>
                <label
                  className="
                    mb-1.5 block
                    text-[10px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Language
                </label>

                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="
                    h-10 w-full
                    rounded-lg
                    border border-white/[0.08]
                    bg-[#0b0c0d]
                    px-3
                    text-[11px]
                    text-zinc-300
                    outline-none
                    focus:border-[#dc9458]/40
                  "
                >
                  <option value="JavaScript">
                    JavaScript
                  </option>

                  <option value="React">
                    React
                  </option>

                  <option value="Python">
                    Python
                  </option>

                  <option value="C++">
                    C++
                  </option>

                  <option value="Node.js">
                    Node.js
                  </option>

                  <option value="Blank">
                    Blank
                  </option>
                </select>
              </div>

              {/* VISIBILITY */}

              <div>
                <label
                  className="
                    mb-1.5 block
                    text-[10px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Visibility
                </label>

                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="
                    h-10 w-full
                    rounded-lg
                    border border-white/[0.08]
                    bg-[#0b0c0d]
                    px-3
                    text-[11px]
                    text-zinc-300
                    outline-none
                    focus:border-[#dc9458]/40
                  "
                >
                  <option value="private">
                    Private
                  </option>

                  <option value="public">
                    Public
                  </option>
                </select>
              </div>
            </div>

            {/* TEMPLATE */}

            <div>
              <label
                className="
                  mb-1.5 block
                  text-[10px]
                  font-medium
                  text-zinc-400
                "
              >
                Template
              </label>

              <select
                name="template"
                value={formData.template}
                onChange={handleChange}
                className="
                  h-10 w-full
                  rounded-lg
                  border border-white/[0.08]
                  bg-[#0b0c0d]
                  px-3
                  text-[11px]
                  text-zinc-300
                  outline-none
                  focus:border-[#dc9458]/40
                "
              >
                <option value="blank">
                  Blank Workspace
                </option>

                <option value="javascript">
                  JavaScript
                </option>

                <option value="react">
                  React
                </option>

                <option value="python">
                  Python
                </option>

                <option value="cpp">
                  C++
                </option>
              </select>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="
                  rounded-lg
                  border border-red-500/20
                  bg-red-500/[0.06]
                  px-3 py-2.5
                  text-[10px]
                  text-red-400
                "
              >
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div
            className="
              flex items-center justify-end
              gap-2
              border-t border-white/[0.06]
              px-5 py-4
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                h-9
                rounded-lg
                border border-white/[0.07]
                bg-white/[0.02]
                px-4
                text-[10px]
                font-medium
                text-zinc-400
                transition-colors
                hover:bg-white/[0.05]
                hover:text-zinc-200
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="
                flex h-9
                items-center
                justify-center
                gap-1.5
                rounded-lg
                bg-[#dc9458]
                px-4
                text-[10px]
                font-semibold
                text-[#17110d]
                transition-all
                hover:bg-[#e5a067]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isCreating ? (
                <>
                  <span
                    className="
                      h-3 w-3
                      animate-spin
                      rounded-full
                      border-2
                      border-[#17110d]/30
                      border-t-[#17110d]
                    "
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Plus size={13} />

                  Create Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WorkspaceMenu = ({
  workspace,
  onClose,
  onDelete,
}) => {
  const navigate = useNavigate();

  const workspaceId = workspace._id;

  const handleOpen = () => {
    navigate(`/workspaces/${workspaceId}`);
    onClose();
  };

  const handleDelete = () => {
    onDelete(workspaceId);
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
          flex w-full
          items-center gap-2.5
          px-3 py-2.5
          text-left
          text-[11px]
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
        className="
          flex w-full
          items-center gap-2.5
          px-3 py-2.5
          text-left
          text-[11px]
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
        className="
          flex w-full
          items-center gap-2.5
          px-3 py-2.5
          text-left
          text-[11px]
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
        disabled={false}
        className="
          flex w-full
          items-center gap-2.5
          px-3 py-2.5
          text-left
          text-[11px]
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

  const language = workspace.language || "Blank";

  const languageInfo =
    languageStyles[language] ||
    languageStyles.Blank;

  const collaborators =
    workspace.members?.length || 1;

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
            ${languageInfo.className}
          `}
        >
          {languageInfo.short}
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

      {/* WORKSPACE INFO */}

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
            className="
              h-1.5 w-1.5
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
              text-[9px]
              text-zinc-700
            "
          >
            <Clock3 size={11} />

            Recently
          </span>
        </div>

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
    data: workspaces = [],
    isLoading,
    isError,
    error,
  } = useWorkspaces();

  const createWorkspaceMutation =
    useCreateWorkspace();

  const deleteWorkspaceMutation =
    useDeleteWorkspace();

  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [filter, setFilter] = useState("All");

  const [openMenu, setOpenMenu] =
    useState(null);

  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) => {
      const searchValue =
        search.toLowerCase().trim();

      const workspaceName =
        workspace.name?.toLowerCase() || "";

      const description =
        workspace.description?.toLowerCase() ||
        "";

      const language =
        workspace.language?.toLowerCase() || "";

      const matchesSearch =
        workspaceName.includes(searchValue) ||
        description.includes(searchValue) ||
        language.includes(searchValue);

      const matchesFilter =
        filter === "All" ||
        workspace.language === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [workspaces, search, filter]);

  const handleCreateWorkspace = async (
    workspaceData
  ) => {
    await createWorkspaceMutation.mutateAsync({
      name: workspaceData.title,

      description:
        workspaceData.description,

      template:
        workspaceData.template,

      language:
        workspaceData.language,

      visibility:
        workspaceData.visibility,
    });
  };

  const handleDelete = async (
    workspaceId
  ) => {
    try {
      await deleteWorkspaceMutation.mutateAsync(
        workspaceId
      );

      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Delete workspace error:",
        error
      );
    }
  };

  const totalWorkspaces =
    workspaces.length;

  const activeWorkspaces =
    workspaces.length;

  const totalMembers =
    workspaces.reduce(
      (total, workspace) =>
        total +
        (workspace.members?.length || 1),
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
            flex min-h-screen
            items-center
            justify-center
            px-6
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto
                h-8 w-8
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
              Loading workspaces...
            </p>
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
                mx-auto
                flex h-11 w-11
                items-center justify-center
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
              Failed to load workspaces
            </h3>

            <p
              className="
                mt-1
                text-[10px]
                text-zinc-600
              "
            >
              {error?.response?.data?.message ||
                "Something went wrong."}
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
          <div
            className="
              mx-auto
              max-w-[1280px]
            "
          >
            
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
                <div
                  className="
                    mb-2
                    flex items-center gap-2
                  "
                >
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
                  setCreateModalOpen(true);
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
              {/* TOTAL */}

              <div
                className="
                  rounded-xl
                  border border-white/[0.07]
                  bg-[#111214]
                  p-4
                "
              >
                <div
                  className="
                    flex items-center
                    justify-between
                  "
                >
                  <FolderKanban
                    size={16}
                    className="text-[#dc9458]"
                  />

                  <span
                    className="
                      text-[9px]
                      text-zinc-700
                    "
                  >
                    TOTAL
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
                  {totalWorkspaces}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-zinc-600
                  "
                >
                  All workspaces
                </p>
              </div>

              {/* ACTIVE */}

              <div
                className="
                  rounded-xl
                  border border-white/[0.07]
                  bg-[#111214]
                  p-4
                "
              >
                <div
                  className="
                    flex items-center
                    justify-between
                  "
                >
                  <Code2
                    size={16}
                    className="text-[#73a8e9]"
                  />

                  <span
                    className="
                      text-[9px]
                      text-zinc-700
                    "
                  >
                    ACTIVE
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
                  {activeWorkspaces}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-zinc-600
                  "
                >
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
                <div
                  className="
                    flex items-center
                    justify-between
                  "
                >
                  <Users
                    size={16}
                    className="text-[#a67adb]"
                  />

                  <span
                    className="
                      text-[9px]
                      text-zinc-700
                    "
                  >
                    MEMBERS
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
                  {totalMembers}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-zinc-600
                  "
                >
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
                      items-center
                      justify-between
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
                    <span
                      className="
                        flex items-center gap-2.5
                      "
                    >
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

                  {filterOpen && (
                    <div
                      className="
                        absolute
                        right-0
                        top-[46px]
                        z-40
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
                      <div
                        className="
                          px-2.5
                          pb-1.5
                          pt-1
                        "
                      >
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
                        {
                          label: "Blank",
                          value: "Blank",
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
                            items-center
                            justify-between
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

              <div
                className="
                  mt-3
                  flex items-center
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

                {(search || filter !== "All") && (
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
                      onDelete={handleDelete}
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
                  {workspaces.length === 0
                    ? "No workspaces yet"
                    : "No workspaces found"}
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
                  {workspaces.length === 0
                    ? "Create your first workspace to start coding."
                    : "Try changing your search or filters."}
                </p>

                {workspaces.length === 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateModalOpen(true);
                    }}
                    className="
                      mt-4
                      flex h-9
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-[#dc9458]
                      px-4
                      text-[10px]
                      font-semibold
                      text-[#17110d]
                      transition-all
                      hover:bg-[#e5a067]
                    "
                  >
                    <Plus size={13} />

                    New Workspace
                  </button>
                ) : (
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
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onCreate={handleCreateWorkspace}
        isCreating={
          createWorkspaceMutation.isPending
        }
      />
    </>
  );
};

export default WorkspacesPage;