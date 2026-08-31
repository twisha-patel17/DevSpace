const Workspace = require("../models/workspace.model");

const createWorkspace = async ({
  userId,
  name,
  description,
  template,
  language,
  visibility,
}) => {
  const workspace = await Workspace.create({
    name,
    description: description || "",
    template: template || "blank",
    language: language || "Blank",
    visibility: visibility || "private",

    owner: userId,

    members: [
      {
        user: userId,
        role: "owner",
      },
    ],
  });

  return workspace;
};

// Get all workspaces user owns or is a member of
const getUserWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ updatedAt: -1 });

  return workspaces;
};

// Get recently updated workspaces
const getRecentWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ updatedAt: -1 })
    .limit(20);

  return workspaces;
};

// Get workspaces shared with the user
const getSharedWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({
    owner: { $ne: userId },
    "members.user": userId,
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ updatedAt: -1 });

  return workspaces;
};

// Get a single workspace
const getWorkspaceById = async ({
  workspaceId,
  userId,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar");

  return workspace;
};

// Update workspace
const updateWorkspace = async ({
  workspaceId,
  userId,
  name,
  description,
  visibility,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) {
    return null;
  }

  if (name !== undefined) {
    workspace.name = name.trim();
  }

  if (description !== undefined) {
    workspace.description = description.trim();
  }

  if (visibility !== undefined) {
    workspace.visibility = visibility;
  }

  await workspace.save();

  return workspace;
};

// Delete workspace
const deleteWorkspace = async ({
  workspaceId,
  userId,
}) => {
  const workspace =
    await Workspace.findOneAndDelete({
      _id: workspaceId,
      owner: userId,
    });

  return workspace;
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getRecentWorkspaces,
  getSharedWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};