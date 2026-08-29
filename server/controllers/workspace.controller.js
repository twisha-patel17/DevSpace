const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} = require("../services/workspace.service");

const createWorkspaceController = async (req, res) => {
  try {
    const {
      name,
      description,
      template,
      language,
      visibility,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const workspace = await createWorkspace({
      userId: req.user.id,
      name: name.trim(),
      description,
      template,
      language,
      visibility,
    });

    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);

    return res.status(500).json({
      message: "Failed to create workspace",
    });
  }
};

const getWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getUserWorkspaces(
      req.user.id
    );

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    console.error("Get workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspaces",
    });
  }
};

const getWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await getWorkspaceById({
      workspaceId,
      userId: req.user.id,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      workspace,
    });
  } catch (error) {
    console.error("Get workspace error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspace",
    });
  }
};

const updateWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const {
      name,
      description,
      visibility,
    } = req.body;

    if (
      name !== undefined &&
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Workspace name cannot be empty",
      });
    }

    if (
      visibility !== undefined &&
      !["private", "public"].includes(visibility)
    ) {
      return res.status(400).json({
        message: "Invalid workspace visibility",
      });
    }

    const workspace = await updateWorkspace({
      workspaceId,
      userId: req.user.id,
      name,
      description,
      visibility,
    });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
      });
    }

    return res.status(200).json({
      message: "Workspace updated successfully",
      workspace,
    });
  } catch (error) {
    console.error("Update workspace error:", error);

    return res.status(500).json({
      message: "Failed to update workspace",
    });
  }
};

const deleteWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await deleteWorkspace({
      workspaceId,
      userId: req.user.id,
    });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
      });
    }

    return res.status(200).json({
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("Delete workspace error:", error);

    return res.status(500).json({
      message: "Failed to delete workspace",
    });
  }
};

module.exports = {
  createWorkspaceController,
  getWorkspacesController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
};