const {
  createWorkspace,
  getUserWorkspaces,
  getRecentWorkspaces,
  getSharedWorkspaces,
  markWorkspaceOpened,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,

  getWorkspaceFiles,
  createWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
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
      userId: req.user.userId,
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
      req.user.userId
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

const getRecentWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getRecentWorkspaces(
      req.user.userId
    );

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    console.error(
      "Get recent workspaces error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch recent workspaces",
    });
  }
};
const getSharedWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getSharedWorkspaces(
      req.user.userId
    );

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    console.error(
      "Get shared workspaces error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch shared workspaces",
    });
  }
};

const getWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await getWorkspaceById({
      workspaceId,
      userId: req.user.userId,
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
      userId: req.user.userId,
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
      userId: req.user.userId,
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

const markWorkspaceOpenedController = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await markWorkspaceOpened({
      workspaceId,
      userId: req.user.userId,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      message: "Workspace marked as opened",
      workspace,
    });
  } catch (error) {
    console.error(
      "Mark workspace opened error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update workspace",
    });
  }
};

const getWorkspaceFilesController = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    const files = await getWorkspaceFiles({
      workspaceId,
      userId: req.user.userId,
    });

    if (!files) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      files,
    });
  } catch (error) {
    console.error(
      "Get workspace files error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch workspace files",
    });
  }
};

const createWorkspaceFileController = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    const {
      name,
      language,
      content,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "File name is required",
      });
    }

    if (!language || !language.trim()) {
      return res.status(400).json({
        message: "File language is required",
      });
    }

    const file = await createWorkspaceFile({
      workspaceId,
      userId: req.user.userId,
      name: name.trim(),
      language: language.trim(),
      content: content || "",
    });

    if (!file) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (file.forbidden) {
      return res.status(403).json({
        message:
          "You do not have permission to create files",
      });
    }

    return res.status(201).json({
      message: "File created successfully",
      file,
    });
  } catch (error) {
    console.error(
      "Create workspace file error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create file",
    });
  }
};

const updateWorkspaceFileController = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      fileId,
    } = req.params;

    const {
      name,
      language,
      content,
    } = req.body;

    if (
      name !== undefined &&
      !name.trim()
    ) {
      return res.status(400).json({
        message: "File name cannot be empty",
      });
    }

    const file = await updateWorkspaceFile({
      workspaceId,
      userId: req.user.userId,
      fileId,
      name,
      language,
      content,
    });

    if (!file) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (file.forbidden) {
      return res.status(403).json({
        message:
          "You do not have permission to modify files",
      });
    }

    if (file.fileNotFound) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.status(200).json({
      message: "File updated successfully",
      file,
    });
  } catch (error) {
    console.error(
      "Update workspace file error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update file",
    });
  }
};

const deleteWorkspaceFileController = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      fileId,
    } = req.params;

    const result = await deleteWorkspaceFile({
      workspaceId,
      userId: req.user.userId,
      fileId,
    });

    if (!result) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        message:
          "You do not have permission to delete files",
      });
    }

    if (result.fileNotFound) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete workspace file error:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete file",
    });
  }
};

module.exports = {
  createWorkspaceController,
  getWorkspacesController,
  getRecentWorkspacesController,
  getSharedWorkspacesController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
  markWorkspaceOpenedController,

  getWorkspaceFilesController,
  createWorkspaceFileController,
  updateWorkspaceFileController,
  deleteWorkspaceFileController,
};