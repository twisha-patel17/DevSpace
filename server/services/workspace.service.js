const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");
const User = require("../models/user.model");

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

const getRecentWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
    lastOpenedAt: { $ne: null },
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ lastOpenedAt: -1 })
    .limit(20);

  return workspaces;
};

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

const deleteWorkspace = async ({
  workspaceId,
  userId,
}) => {
  const workspace = await Workspace.findOneAndDelete({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) {
    return null;
  }

  // Delete all files belonging to the workspace
  await File.deleteMany({
    workspace: workspaceId,
  });

  return workspace;
};

const markWorkspaceOpened = async ({
  workspaceId,
  userId,
}) => {
  const workspace = await Workspace.findOneAndUpdate(
    {
      _id: workspaceId,
      $or: [
        { owner: userId },
        { "members.user": userId },
      ],
    },
    {
      $set: {
        lastOpenedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  return workspace;
};

const getWorkspaceFiles = async ({
  workspaceId,
  userId,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  });

  if (!workspace) {
    return null;
  }

  const files = await File.find({
    workspace: workspaceId,
  })
    .populate("createdBy", "username email avatar")
    .populate("updatedBy", "username email avatar")
    .sort({ type: 1, name: 1 });

  return files;
};

const createWorkspaceFile = async ({
  workspaceId,
  userId,
  name,
  language,
  content,
  path,
  type,
  parent,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  });

  if (!workspace) {
    return null;
  }

  const isOwner =
    workspace.owner.toString() === userId.toString();

  const member = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === userId.toString()
  );

  const canEdit =
    isOwner || member?.role === "editor";

  if (!canEdit) {
    return {
      forbidden: true,
    };
  }

  const file = await File.create({
    workspace: workspaceId,
    name,
    path: path || name,
    type: type || "file",
    language: language || null,
    content: content || "",
    parent: parent || null,
    createdBy: userId,
    updatedBy: userId,
  });

  return file;
};

const updateWorkspaceFile = async ({
  workspaceId,
  userId,
  fileId,
  name,
  language,
  content,
  path,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  });

  if (!workspace) {
    return null;
  }

  const isOwner =
    workspace.owner.toString() === userId.toString();

  const member = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === userId.toString()
  );

  const canEdit =
    isOwner || member?.role === "editor";

  if (!canEdit) {
    return {
      forbidden: true,
    };
  }

  const file = await File.findOne({
    _id: fileId,
    workspace: workspaceId,
  });

  if (!file) {
    return {
      fileNotFound: true,
    };
  }

  if (name !== undefined) {
    file.name = name.trim();
  }

  if (language !== undefined) {
    file.language = language;
  }

  if (content !== undefined) {
    file.content = content;
  }

  if (path !== undefined) {
    file.path = path.trim();
  }

  file.updatedBy = userId;

  await file.save();

  return file;
};

const deleteWorkspaceFile = async ({
  workspaceId,
  userId,
  fileId,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId },
    ],
  });

  if (!workspace) {
    return null;
  }

  const isOwner =
    workspace.owner.toString() === userId.toString();

  const member = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === userId.toString()
  );

  const canEdit =
    isOwner || member?.role === "editor";

  if (!canEdit) {
    return {
      forbidden: true,
    };
  }

  const file = await File.findOne({
    _id: fileId,
    workspace: workspaceId,
  });

  if (!file) {
    return {
      fileNotFound: true,
    };
  }

  // If this is a folder, delete its entire subtree.
  if (file.type === "folder") {
    const prefix = `${file.path}/`;

    await File.deleteMany({
      workspace: workspaceId,
      $or: [
        { _id: file._id },
        { path: { $regex: `^${prefix}` } },
      ],
    });
  } else {
    await file.deleteOne();
  }

  return {
    success: true,
  };
};

const addWorkspaceMember = async ({
  workspaceId,
  userId,
  memberUserId,
  role,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) {
    return null;
  }

  if (!["editor", "viewer"].includes(role)) {
    return {
      invalidRole: true,
    };
  }

  const memberUser = await User.findById(memberUserId);

  if (!memberUser) {
    return {
      userNotFound: true,
    };
  }

  // Owner is already a member.
  if (workspace.owner.toString() === memberUserId.toString()) {
    return {
      ownerCannotBeAdded: true,
    };
  }

  const existingMember = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === memberUserId.toString()
  );

  if (existingMember) {
    return {
      alreadyMember: true,
    };
  }

  workspace.members.push({
    user: memberUserId,
    role,
  });

  await workspace.save();

  await workspace.populate(
    "members.user",
    "username email avatar"
  );

  return workspace;
};

const updateWorkspaceMemberRole = async ({
  workspaceId,
  userId,
  memberUserId,
  role,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) {
    return null;
  }

  if (!["editor", "viewer"].includes(role)) {
    return {
      invalidRole: true,
    };
  }

  if (workspace.owner.toString() === memberUserId.toString()) {
    return {
      ownerCannotBeModified: true,
    };
  }

  const member = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === memberUserId.toString()
  );

  if (!member) {
    return {
      memberNotFound: true,
    };
  }

  member.role = role;

  await workspace.save();

  await workspace.populate(
    "members.user",
    "username email avatar"
  );

  return workspace;
};

const removeWorkspaceMember = async ({
  workspaceId,
  userId,
  memberUserId,
}) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) {
    return null;
  }

  if (workspace.owner.toString() === memberUserId.toString()) {
    return {
      ownerCannotBeRemoved: true,
    };
  }

  const memberIndex = workspace.members.findIndex(
    (member) =>
      member.user &&
      member.user.toString() === memberUserId.toString()
  );

  if (memberIndex === -1) {
    return {
      memberNotFound: true,
    };
  }

  workspace.members.splice(memberIndex, 1);

  await workspace.save();

  return {
    success: true,
  };
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getRecentWorkspaces,
  getSharedWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  markWorkspaceOpened,

  getWorkspaceFiles,
  createWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
};