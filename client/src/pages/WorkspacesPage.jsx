import {
  useState,
} from "react";

import {
  Folder,
  Plus,
  Search,
  Clock3,
  Users,
  MoreHorizontal,
  Trash2,
  Pencil,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useRecentWorkspaces,
  useSharedWorkspaces,
  useUpdateWorkspace,
  useWorkspaces,
} from "../lib/workspace.queries";

const WorkspacesPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [showEditModal, setShowEditModal] =
    useState(false);

  const [selectedWorkspace, setSelectedWorkspace] =
    useState(null);

  const [workspaceName, setWorkspaceName] =
    useState("");

  const [workspaceDescription, setWorkspaceDescription] =
    useState("");

  const [workspaceVisibility, setWorkspaceVisibility] =
    useState("private");

  const {
    data: workspaces = [],
    isLoading: workspacesLoading,
  } = useWorkspaces();

  const {
    data: recentWorkspaces = [],
    isLoading: recentLoading,
  } = useRecentWorkspaces();

  const {
    data: sharedWorkspaces = [],
    isLoading: sharedLoading,
  } = useSharedWorkspaces();

  const createWorkspaceMutation =
    useCreateWorkspace();

  const updateWorkspaceMutation =
    useUpdateWorkspace();

  const deleteWorkspaceMutation =
    useDeleteWorkspace();

  const filteredWorkspaces =
    workspaces.filter((workspace) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        workspace.name
          ?.toLowerCase()
          .includes(query) ||
        workspace.description
          ?.toLowerCase()
          .includes(query)
      );
    });

  const filteredRecentWorkspaces =
    recentWorkspaces.filter((workspace) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return workspace.name
        ?.toLowerCase()
        .includes(query);
    });

  const filteredSharedWorkspaces =
    sharedWorkspaces.filter((workspace) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return workspace.name
        ?.toLowerCase()
        .includes(query);
    });

  const handleCreateWorkspace = async (
    event
  ) => {
    event.preventDefault();

    if (!workspaceName.trim()) {
      return;
    }

    try {
      const workspace =
        await createWorkspaceMutation.mutateAsync(
          {
            name: workspaceName.trim(),
            description:
              workspaceDescription.trim(),
            visibility:
              workspaceVisibility,
          }
        );

      setShowCreateModal(false);

      setWorkspaceName("");
      setWorkspaceDescription("");
      setWorkspaceVisibility("private");

      if (workspace?._id) {
        navigate(
          `/workspaces/${workspace._id}`
        );
      }
    } catch (error) {
      console.error(
        "Failed to create workspace:",
        error
      );
    }
  };

  const openEditModal = (
    workspace
  ) => {
    setSelectedWorkspace(workspace);

    setWorkspaceName(
      workspace.name || ""
    );

    setWorkspaceDescription(
      workspace.description || ""
    );

    setWorkspaceVisibility(
      workspace.visibility || "private"
    );

    setShowEditModal(true);
  };

  const handleUpdateWorkspace = async (
    event
  ) => {
    event.preventDefault();

    if (
      !selectedWorkspace ||
      !workspaceName.trim()
    ) {
      return;
    }

    try {
      await updateWorkspaceMutation.mutateAsync(
        {
          workspaceId:
            selectedWorkspace._id,

          workspaceData: {
            name: workspaceName.trim(),
            description:
              workspaceDescription.trim(),
            visibility:
              workspaceVisibility,
          },
        }
      );

      setShowEditModal(false);
      setSelectedWorkspace(null);

      setWorkspaceName("");
      setWorkspaceDescription("");
      setWorkspaceVisibility("private");
    } catch (error) {
      console.error(
        "Failed to update workspace:",
        error
      );
    }
  };

  const handleDeleteWorkspace = async (
    workspace
  ) => {
    const confirmed =
      window.confirm(
        `Delete workspace "${workspace.name}"? This will also delete all files inside it.`
      );

    if (!confirmed) {
      return;
    }

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

  const openWorkspace = (
    workspace
  ) => {
    navigate(
      `/workspaces/${workspace._id}`
    );
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "No recent activity";
    }

    return new Date(
      date
    ).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const WorkspaceCard = ({
    workspace,
    shared = false,
  }) => {
    return (
      <div
        className="group relative rounded-xl border border-zinc-800 bg-[#0d0d0f] p-4 transition hover:border-zinc-700 hover:bg-[#111114]"
      >
        <button
          type="button"
          onClick={() =>
            openWorkspace(workspace)
          }
          className="w-full text-left"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Folder size={19} />
            </div>

            <ArrowRight
              size={16}
              className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
            />
          </div>

          <h3 className="truncate text-sm font-semibold text-zinc-100">
            {workspace.name}
          </h3>

          <p className="mt-1 min-h-[20px] truncate text-xs text-zinc-500">
            {workspace.description ||
              "No description"}
          </p>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1">
              <Clock3 size={12} />
              {formatDate(
                workspace.updatedAt
              )}
            </span>

            <span className="flex items-center gap-1">
              <Users size={12} />
              {workspace.members?.length ||
                0}
            </span>

            {shared && (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-400">
                Shared
              </span>
            )}
          </div>
        </button>

        {!shared && (
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
              }}
              className="rounded-md p-1.5 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100"
            >
              <MoreHorizontal
                size={16}
              />
            </button>

            <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-36 rounded-lg border border-zinc-800 bg-[#111114] p-1 shadow-xl group-focus-within:block">
              <button
                type="button"
                onClick={() =>
                  openEditModal(
                    workspace
                  )
                }
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <Pencil size={13} />
                Rename
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeleteWorkspace(
                    workspace
                  )
                }
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const WorkspaceGrid = ({
    items,
    loading,
    emptyMessage,
    shared = false,
  }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-[#0d0d0f]"
              />
            )
          )}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-[#0d0d0f]/50 px-6 py-12 text-center">
          <Folder
            size={24}
            className="mx-auto text-zinc-700"
          />

          <p className="mt-3 text-sm text-zinc-500">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(
          (workspace) => (
            <WorkspaceCard
              key={workspace._id}
              workspace={workspace}
              shared={shared}
            />
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200">

      {/* Header */}

      <header className="border-b border-zinc-800 bg-[#0d0d0f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-xl font-semibold text-white">
              Workspaces
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Build, manage, and collaborate
              on your projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowCreateModal(true)
            }
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={16} />
            New Workspace
          </button>

        </div>
      </header>

      {/* Content */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Search */}

        <div className="mb-8 flex items-center gap-3">

          <div className="relative max-w-md flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search workspaces..."
              className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50"
            />
          </div>

        </div>

        {/* Recent */}

        <section className="mb-10">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-zinc-200">
                Recent
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Workspaces you've opened recently.
              </p>
            </div>

          </div>

          <WorkspaceGrid
            items={
              filteredRecentWorkspaces
            }
            loading={recentLoading}
            emptyMessage="No recently opened workspaces."
          />

        </section>

        {/* My Workspaces */}

        <section className="mb-10">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-zinc-200">
                My Workspaces
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Workspaces you own.
              </p>
            </div>

            <span className="text-xs text-zinc-600">
              {filteredWorkspaces.length}{" "}
              workspace
              {filteredWorkspaces.length !==
              1
                ? "s"
                : ""}
            </span>

          </div>

          <WorkspaceGrid
            items={
              filteredWorkspaces
            }
            loading={
              workspacesLoading
            }
            emptyMessage="You haven't created any workspaces yet."
          />

        </section>

        {/* Shared */}

        <section>

          <div className="mb-4">

            <h2 className="text-sm font-semibold text-zinc-200">
              Shared With Me
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              Workspaces other people have
              shared with you.
            </p>

          </div>

          <WorkspaceGrid
            items={
              filteredSharedWorkspaces
            }
            loading={sharedLoading}
            emptyMessage="No workspaces have been shared with you."
            shared
          />

        </section>

      </main>

      {/* Create Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#111114] p-6 shadow-2xl">

            <div className="mb-6">
              <h2 className="text-base font-semibold text-white">
                Create Workspace
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Create a new environment for
                your project.
              </p>
            </div>

            <form
              onSubmit={
                handleCreateWorkspace
              }
              className="space-y-4"
            >

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Name
                </label>

                <input
                  autoFocus
                  value={workspaceName}
                  onChange={(event) =>
                    setWorkspaceName(
                      event.target.value
                    )
                  }
                  placeholder="My Project"
                  className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Description
                </label>

                <textarea
                  value={
                    workspaceDescription
                  }
                  onChange={(event) =>
                    setWorkspaceDescription(
                      event.target.value
                    )
                  }
                  placeholder="What are you building?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Visibility
                </label>

                <select
                  value={
                    workspaceVisibility
                  }
                  onChange={(event) =>
                    setWorkspaceVisibility(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50"
                >
                  <option value="private">
                    Private
                  </option>

                  <option value="public">
                    Public
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !workspaceName.trim() ||
                    createWorkspaceMutation.isPending
                  }
                  className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {createWorkspaceMutation.isPending
                    ? "Creating..."
                    : "Create Workspace"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Edit Modal */}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#111114] p-6 shadow-2xl">

            <div className="mb-6">
              <h2 className="text-base font-semibold text-white">
                Edit Workspace
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Update your workspace details.
              </p>
            </div>

            <form
              onSubmit={
                handleUpdateWorkspace
              }
              className="space-y-4"
            >

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Name
                </label>

                <input
                  autoFocus
                  value={workspaceName}
                  onChange={(event) =>
                    setWorkspaceName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Description
                </label>

                <textarea
                  value={
                    workspaceDescription
                  }
                  onChange={(event) =>
                    setWorkspaceDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Visibility
                </label>

                <select
                  value={
                    workspaceVisibility
                  }
                  onChange={(event) =>
                    setWorkspaceVisibility(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50"
                >
                  <option value="private">
                    Private
                  </option>

                  <option value="public">
                    Public
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(
                      false
                    );
                    setSelectedWorkspace(
                      null
                    );
                  }}
                  className="rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !workspaceName.trim() ||
                    updateWorkspaceMutation.isPending
                  }
                  className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updateWorkspaceMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default WorkspacesPage;