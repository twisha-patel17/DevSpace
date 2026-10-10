
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
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} = require("../services/workspace.service");

const mongoose = require("mongoose");

// Broadcast successful file-tree changes to workspace collaborators.
const emitWorkspaceFilesChanged = (req, workspaceId, payload) => {
  const io = req.app.get("io");

  if (!io) {
    console.error("Socket.IO instance is unavailable");
    return;
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:files-changed", {
    workspaceId: String(workspaceId),
    changedBy: req.user.userId,
    ...payload,
  });
};

const createWorkspaceController = async (req, res) => {
  try {
    const { name, description, template, language, visibility } = req.body;

    if (typeof name !== "string" || !name.trim()) {
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
    const workspaces = await getUserWorkspaces(req.user.userId);

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspaces",
    });
  }
};

const getRecentWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getRecentWorkspaces(req.user.userId);

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get recent workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspaces",
    });
  }
};

const getSharedWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getSharedWorkspaces(req.user.userId);

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get shared workspaces error:", error);

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
      userId: req.user.userId,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json({ workspace });
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
    const { name, description, visibility } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
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
        message: "Workspace not found or you are not the owner",
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
        message: "Workspace not found or you are not the owner",
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

const markWorkspaceOpenedController = async (req, res) => {
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
    console.error("Mark workspace opened error:", error);

    return res.status(500).json({
      message: "Failed to update workspace",
    });
  }
};

const getWorkspaceFilesController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

    const files = await getWorkspaceFiles({
      workspaceId,
      userId: req.user.userId,
    });

    if (!files) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json({ files });
  } catch (error) {
    console.error("Get workspace files error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspace files",
    });
  }
};

const createWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, language, content, path, type, parent } = req.body;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "A valid file or folder name is required",
      });
    }

    if (
      path !== undefined &&
      path !== null &&
      typeof path !== "string"
    ) {
      return res.status(400).json({
        message: "File path must be a string",
      });
    }

    if (
      content !== undefined &&
      typeof content !== "string"
    ) {
      return res.status(400).json({
        message: "File content must be a string",
      });
    }

    if (
      language !== undefined &&
      language !== null &&
      typeof language !== "string"
    ) {
      return res.status(400).json({
        message: "File language must be a string",
      });
    }

    if (
      type !== undefined &&
      !["file", "folder"].includes(type)
    ) {
      return res.status(400).json({
        message: "Type must be either file or folder",
      });
    }

    if (
      parent !== undefined &&
      parent !== null &&
      !mongoose.isValidObjectId(parent)
    ) {
      return res.status(400).json({
        message: "Invalid parent folder ID",
      });
    }

    const result = await createWorkspaceFile({
      workspaceId,
      userId: req.user.userId,
      name: name.trim(),
      language,
      content,
      path: path?.trim() || undefined,
      type,
      parent: parent || null,
    });

    if (!result) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        message: "You do not have permission to modify this workspace",
      });
    }

    // Broadcast only after the file has been created successfully.
    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "created",
      fileId: result._id.toString(),
    });

    return res.status(201).json({
      message: "File or folder created successfully",
      file: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A file or folder already exists at this path",
      });
    }

    const validationErrors = [
      "Parent folder not found",
      "File path does not match its name and parent folder",
      "A valid file or folder name is required",
      "Invalid file type",
      "File content must be a string",
      "File language must be a string",
    ];

    if (validationErrors.includes(error.message)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create workspace file error:", error);

    return res.status(500).json({
      message: "Failed to create file or folder",
    });
  }
};

const updateWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId, fileId } = req.params;
    const { name, language, content, path } = req.body;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(fileId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or file ID",
      });
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        message: "A valid file or folder name is required",
      });
    }

    if (path !== undefined && typeof path !== "string") {
      return res.status(400).json({
        message: "File path must be a string",
      });
    }

    if (
      content !== undefined &&
      typeof content !== "string"
    ) {
      return res.status(400).json({
        message: "File content must be a string",
      });
    }

    if (
      language !== undefined &&
      language !== null &&
      typeof language !== "string"
    ) {
      return res.status(400).json({
        message: "File language must be a string",
      });
    }

    const result = await updateWorkspaceFile({
      workspaceId,
      userId: req.user.userId,
      fileId,
      name: name === undefined ? undefined : name.trim(),
      language,
      content,
      path: path === undefined ? undefined : path.trim(),
    });

    if (!result) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        message: "You do not have permission to modify this workspace",
      });
    }

    if (result.fileNotFound) {
      return res.status(404).json({
        message: "File or folder not found",
      });
    }

    // A rename can affect descendants, so the frontend will refresh the tree.
    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "updated",
      fileId: result._id.toString(),
    });

    return res.status(200).json({
      message: "File or folder updated successfully",
      file: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A file or folder already exists at this path",
      });
    }

    const validationErrors = [
      "A valid file or folder name is required",
      "File path must be a string",
      "File content must be a string",
      "File language must be a string",
      "Folders cannot contain file content",
      "Folder paths are managed by their names and parents",
      "A valid file path is required",
      "File path must end with the file name",
      "File path must end with the new file name",
    ];

    if (validationErrors.includes(error.message)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Update workspace file error:", error);

    return res.status(500).json({
      message: "Failed to update file or folder",
    });
  }
};

const deleteWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId, fileId } = req.params;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(fileId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or file ID",
      });
    }

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
        message: "You do not have permission to modify this workspace",
      });
    }

    if (result.fileNotFound) {
      return res.status(404).json({
        message: "File or folder not found",
      });
    }

    // Broadcast after deletion, including descendants of deleted folders.
    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "deleted",
      fileId,
      fileIds: result.fileIds,
    });

    return res.status(200).json({
      message: "File or folder deleted successfully",
      deletedCount: result.deletedCount,
      fileIds: result.fileIds,
    });
  } catch (error) {
    console.error("Delete workspace file error:", error);

    return res.status(500).json({
      message: "Failed to delete file or folder",
    });
  }
};

const addWorkspaceMemberController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userId: memberUserId, role } = req.body;

    if (!memberUserId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        message: "Member role is required",
      });
    }

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    const workspace = await addWorkspaceMember({
      workspaceId,
      userId: req.user.userId,
      memberUserId,
      role,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found or you are not the owner",
      });
    }

    if (workspace.invalidRole) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    if (workspace.userNotFound) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (workspace.ownerCannotBeAdded) {
      return res.status(400).json({
        message: "Workspace owner is already a member",
      });
    }

    if (workspace.alreadyMember) {
      return res.status(409).json({
        message: "User is already a workspace member",
      });
    }

    return res.status(201).json({
      message: "Member added successfully",
      workspace,
    });
  } catch (error) {
    console.error("Add workspace member error:", error);

    return res.status(500).json({
      message: "Failed to add workspace member",
    });
  }
};

const updateWorkspaceMemberRoleController = async (req, res) => {
  try {
    const { workspaceId, memberUserId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        message: "Member role is required",
      });
    }

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    const workspace = await updateWorkspaceMemberRole({
      workspaceId,
      userId: req.user.userId,
      memberUserId,
      role,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found or you are not the owner",
      });
    }

    if (workspace.invalidRole) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    if (workspace.ownerCannotBeModified) {
      return res.status(400).json({
        message: "Workspace owner role cannot be modified",
      });
    }

    if (workspace.memberNotFound) {
      return res.status(404).json({
        message: "Workspace member not found",
      });
    }

    return res.status(200).json({
      message: "Member role updated successfully",
      workspace,
    });
  } catch (error) {
    console.error("Update workspace member role error:", error);

    return res.status(500).json({
      message: "Failed to update member role",
    });
  }
};

const removeWorkspaceMemberController = async (req, res) => {
  try {
    const { workspaceId, memberUserId } = req.params;

    const result = await removeWorkspaceMember({
      workspaceId,
      userId: req.user.userId,
      memberUserId,
    });

    if (!result) {
      return res.status(404).json({
        message: "Workspace not found or you are not the owner",
      });
    }

    if (result.ownerCannotBeRemoved) {
      return res.status(400).json({
        message: "Workspace owner cannot be removed",
      });
    }

    if (result.memberNotFound) {
      return res.status(404).json({
        message: "Workspace member not found",
      });
    }

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove workspace member error:", error);

    return res.status(500).json({
      message: "Failed to remove workspace member",
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
  addWorkspaceMemberController,
  updateWorkspaceMemberRoleController,
  removeWorkspaceMemberController,
};