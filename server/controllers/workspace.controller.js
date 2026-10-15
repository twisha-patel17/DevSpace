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

const {
  createNotification,
} = require("../services/notification.service");

const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");
const mongoose = require("mongoose");

const isValidObjectId = (id) =>
  mongoose.isValidObjectId(id);

const createWorkspaceNotification = async ({
  recipient,
  actor,
  workspaceId,
  type,
  title,
  message,
}) => {
  try {
    await createNotification({
      recipient,
      actor,
      workspace: workspaceId,
      type,
      title,
      message,
    });
  } catch (error) {
    console.error(
      "Failed to create workspace notification:",
      error.message
    );
  }
};

const notifyWorkspaceMembers = async ({
  workspaceId,
  actorId,
  type,
  title,
  message,
}) => {
  try {
    const workspace = await Workspace.findById(workspaceId)
      .select("name owner members.user")
      .lean();

    if (!workspace) return;

    const recipientIds = new Set();

    if (workspace.owner) {
      recipientIds.add(workspace.owner.toString());
    }

    for (const member of workspace.members || []) {
      const memberId = member.user?._id || member.user;

      if (memberId) {
        recipientIds.add(memberId.toString());
      }
    }

    recipientIds.delete(String(actorId));

    await Promise.all(
      [...recipientIds].map((recipient) =>
        createWorkspaceNotification({
          recipient,
          actor: actorId,
          workspaceId,
          type,
          title,
          message:
            typeof message === "function"
              ? message(workspace.name)
              : message,
        })
      )
    );
  } catch (error) {
    console.error(
      "Failed to notify workspace members:",
      error.message
    );
  }
};

const emitWorkspaceFilesChanged = (
  req,
  workspaceId,
  payload
) => {
  const io = req.app.get("io");

  if (!io) {
    console.error("Socket.IO instance is unavailable");
    return;
  }

  io.to(`workspace:${workspaceId}`).emit(
    "workspace:files-changed",
    {
      workspaceId: String(workspaceId),
      changedBy: req.user.userId,
      ...payload,
    }
  );
};

// CREATE WORKSPACE
const createWorkspaceController = async (req, res) => {
  try {
    const {
      name,
      description,
      template,
      language,
      visibility,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 60
    ) {
      return res.status(400).json({
        message:
          "Workspace name is required and must not exceed 60 characters",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" ||
        description.length > 200)
    ) {
      return res.status(400).json({
        message:
          "Workspace description must be a string of at most 200 characters",
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

    return res.status(error.statusCode || 500).json({
      message:
        error.message || "Failed to create workspace",
    });
  }
};

// GET ALL WORKSPACES
const getWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getUserWorkspaces(
      req.user.userId
    );

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch workspaces",
    });
  }
};

// GET RECENT WORKSPACES
const getRecentWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getRecentWorkspaces(
      req.user.userId
    );

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get recent workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch recent workspaces",
      ...(process.env.NODE_ENV !== "production" && {
        error: error.message,
      }),
    });
  }
};

// GET SHARED WORKSPACES
const getSharedWorkspacesController = async (req, res) => {
  try {
    const workspaces = await getSharedWorkspaces(
      req.user.userId
    );

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Get shared workspaces error:", error);

    return res.status(500).json({
      message: "Failed to fetch shared workspaces",
    });
  }
};

// GET SINGLE WORKSPACE
const getWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

    const currentUserId = String(req.user.userId);

    const workspace = await getWorkspaceById({
      workspaceId,
      userId: currentUserId,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const workspaceData = workspace.toObject();

    const ownerId = String(
      workspaceData.owner?._id ??
        workspaceData.owner
    );

    const currentMember = workspaceData.members?.find(
      (member) => {
        const memberId = String(
          member.user?._id ?? member.user
        );

        return memberId === currentUserId;
      }
    );

    const role =
      ownerId === currentUserId
        ? "owner"
        : currentMember?.role ?? null;

    return res.status(200).json({
      workspace: {
        ...workspaceData,
        role,
        currentUserId,
      },
    });
  } catch (error) {
    console.error("Get workspace error:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.message || "Failed to fetch workspace",
    });
  }
};

// UPDATE WORKSPACE SETTINGS
const updateWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, visibility } = req.body;

    if (!isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

    if (
      name !== undefined &&
      (typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 60)
    ) {
      return res.status(400).json({
        message:
          "Workspace name must contain 1–60 characters",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" ||
        description.length > 200)
    ) {
      return res.status(400).json({
        message:
          "Workspace description must not exceed 200 characters",
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

    const updates = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (visibility !== undefined) {
      updates.visibility = visibility;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No workspace settings were provided",
      });
    }

    const workspace = await updateWorkspace({
      workspaceId,
      userId: req.user.userId,
      ...updates,
    });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
      });
    }

    await notifyWorkspaceMembers({
      workspaceId,
      actorId: req.user.userId,
      type: "workspace_updated",
      title: "Workspace updated",
      message: (workspaceName) =>
        `"${workspaceName}" workspace settings were updated.`,
    });

    return res.status(200).json({
      message: "Workspace settings updated successfully",
      workspace,
    });
  } catch (error) {
    console.error("Update workspace error:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.message || "Failed to update workspace",
    });
  }
};

// DELETE WORKSPACE
const deleteWorkspaceController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

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

    return res.status(error.statusCode || 500).json({
      message:
        error.message || "Failed to delete workspace",
    });
  }
};

// MARK WORKSPACE AS OPENED
const markWorkspaceOpenedController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!isValidObjectId(workspaceId)) {
      return res.status(400).json({
        message: "Invalid workspace ID",
      });
    }

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

    return res.status(error.statusCode || 500).json({
      message: "Failed to update workspace",
    });
  }
};

// GET WORKSPACE FILES
const getWorkspaceFilesController = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!isValidObjectId(workspaceId)) {
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

    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch workspace files",
    });
  }
};

// CREATE FILE OR FOLDER
const createWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      name,
      language,
      content,
      path,
      type,
      parent,
    } = req.body;
    const actorId = req.user.userId;

    if (!isValidObjectId(workspaceId)) {
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
      !isValidObjectId(parent)
    ) {
      return res.status(400).json({
        message: "Invalid parent folder ID",
      });
    }

    const result = await createWorkspaceFile({
      workspaceId,
      userId: actorId,
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
        message:
          "You do not have permission to modify this workspace",
      });
    }

    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "created",
      fileId: result._id.toString(),
    });

    const isFolder = result.type === "folder";

    await notifyWorkspaceMembers({
      workspaceId,
      actorId,
      type: "file_created",
      title: isFolder ? "Folder created" : "File created",
      message: (workspaceName) =>
        `${isFolder ? "A folder" : "A file"} "${result.name}" was created in "${workspaceName}".`,
    });

    return res.status(201).json({
      message: "File or folder created successfully",
      file: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A file or folder already exists at this path",
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

// UPDATE FILE OR FOLDER
const updateWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId, fileId } = req.params;
    const { name, language, content, path } = req.body;
    const actorId = req.user.userId;

    if (
      !isValidObjectId(workspaceId) ||
      !isValidObjectId(fileId)
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

    const existingFile = await File.findOne({
      _id: fileId,
      workspace: workspaceId,
    }).select("name path type");

    const result = await updateWorkspaceFile({
      workspaceId,
      userId: actorId,
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
        message:
          "You do not have permission to modify this workspace",
      });
    }

    if (result.fileNotFound) {
      return res.status(404).json({
        message: "File or folder not found",
      });
    }

    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "updated",
      fileId: result._id.toString(),
    });

    const metadataChanged =
      existingFile &&
      (existingFile.name !== result.name ||
        existingFile.path !== result.path);

    if (metadataChanged) {
      const isFolder = result.type === "folder";

      await notifyWorkspaceMembers({
        workspaceId,
        actorId,
        type: "file_updated",
        title: isFolder ? "Folder renamed" : "File updated",
        message: (workspaceName) =>
          `${isFolder ? "A folder" : "A file"} is now named "${result.name}" in "${workspaceName}".`,
      });
    }

    return res.status(200).json({
      message: "File or folder updated successfully",
      file: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A file or folder already exists at this path",
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

// DELETE FILE OR FOLDER
const deleteWorkspaceFileController = async (req, res) => {
  try {
    const { workspaceId, fileId } = req.params;
    const actorId = req.user.userId;

    if (
      !isValidObjectId(workspaceId) ||
      !isValidObjectId(fileId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or file ID",
      });
    }

    const fileToDelete = await File.findOne({
      _id: fileId,
      workspace: workspaceId,
    }).select("name type");

    const result = await deleteWorkspaceFile({
      workspaceId,
      userId: actorId,
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
          "You do not have permission to modify this workspace",
      });
    }

    if (result.fileNotFound) {
      return res.status(404).json({
        message: "File or folder not found",
      });
    }

    emitWorkspaceFilesChanged(req, workspaceId, {
      action: "deleted",
      fileId,
      fileIds: result.fileIds,
    });

    if (fileToDelete) {
      const isFolder = fileToDelete.type === "folder";

      await notifyWorkspaceMembers({
        workspaceId,
        actorId,
        type: "file_deleted",
        title: isFolder ? "Folder deleted" : "File deleted",
        message: (workspaceName) =>
          `${isFolder ? "The folder" : "The file"} "${fileToDelete.name}" was deleted from "${workspaceName}".`,
      });
    }

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

// ADD MEMBER
const addWorkspaceMemberController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userId: memberUserId, role } = req.body;
    const actorId = req.user.userId;

    if (
      !isValidObjectId(workspaceId) ||
      !isValidObjectId(memberUserId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or user ID",
      });
    }

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    const workspace = await addWorkspaceMember({
      workspaceId,
      userId: actorId,
      memberUserId,
      role,
    });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
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

    const workspaceDetails = await Workspace.findById(
      workspaceId
    )
      .select("name")
      .lean();

    await createWorkspaceNotification({
      recipient: memberUserId,
      actor: actorId,
      workspaceId,
      type: "workspace_invitation",
      title: "Added to a workspace",
      message: `You were added to "${workspaceDetails?.name || "a workspace"}" as a ${role}.`,
    });

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

// UPDATE MEMBER ROLE
const updateWorkspaceMemberRoleController = async (
  req,
  res
) => {
  try {
    const { workspaceId, memberUserId } = req.params;
    const { role } = req.body;
    const actorId = req.user.userId;

    if (
      !isValidObjectId(workspaceId) ||
      !isValidObjectId(memberUserId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or member ID",
      });
    }

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid member role",
      });
    }

    const workspace = await updateWorkspaceMemberRole({
      workspaceId,
      userId: actorId,
      memberUserId,
      role,
    });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
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

    const workspaceDetails = await Workspace.findById(
      workspaceId
    )
      .select("name")
      .lean();

    await createWorkspaceNotification({
      recipient: memberUserId,
      actor: actorId,
      workspaceId,
      type: "role_changed",
      title: "Workspace role updated",
      message: `Your role in "${workspaceDetails?.name || "a workspace"}" was changed to ${role}.`,
    });

    return res.status(200).json({
      message: "Member role updated successfully",
      workspace,
    });
  } catch (error) {
    console.error(
      "Update workspace member role error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update member role",
    });
  }
};

// REMOVE MEMBER
const removeWorkspaceMemberController = async (
  req,
  res
) => {
  try {
    const { workspaceId, memberUserId } = req.params;
    const actorId = req.user.userId;

    if (
      !isValidObjectId(workspaceId) ||
      !isValidObjectId(memberUserId)
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID or member ID",
      });
    }

    const workspaceDetails = await Workspace.findById(
      workspaceId
    )
      .select("name")
      .lean();

    const result = await removeWorkspaceMember({
      workspaceId,
      userId: actorId,
      memberUserId,
    });

    if (!result) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
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

    await createWorkspaceNotification({
      recipient: memberUserId,
      actor: actorId,
      workspaceId,
      type: "member_removed",
      title: "Removed from workspace",
      message: `You were removed from "${workspaceDetails?.name || "a workspace"}".`,
    });

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
