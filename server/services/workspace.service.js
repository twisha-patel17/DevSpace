const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");
const User = require("../models/user.model");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePath = (value) =>
  value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

const isValidName = (name) =>
  typeof name === "string" &&
  name.trim().length > 0 &&
  name.trim().length <= 100 &&
  !/[\\/]/.test(name.trim()) &&
  name.trim() !== "." &&
  name.trim() !== "..";

const getWorkspaceForMember = async (workspaceId, userId) =>
  Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: userId }, { "members.user": userId }],
  });

const getMemberRole = (workspace, userId) => {
  if (workspace.owner.toString() === userId.toString()) {
    return "owner";
  }

  const member = workspace.members.find(
    (entry) =>
      entry.user &&
      entry.user.toString() === userId.toString()
  );

  return member?.role || null;
};

const canEditWorkspace = (workspace, userId) =>
  ["owner", "editor"].includes(getMemberRole(workspace, userId));

const getWorkspaceSubtree = async (workspaceId, folderPath) => {
  const prefix = `${escapeRegex(folderPath)}/`;

  return File.find({
    workspace: workspaceId,
    path: { $regex: `^${prefix}` },
  });
};

const createWorkspace = async ({
  userId,
  name,
  description,
  template,
  language,
  visibility,
}) => {
  return Workspace.create({
    name,
    description: description || "",
    template: template || "blank",
    language: language || "Blank",
    visibility: visibility || "private",
    owner: userId,
    members: [{ user: userId, role: "owner" }],
  });
};

const getUserWorkspaces = async (userId) => {
  return Workspace.find({
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ updatedAt: -1 });
};

const getRecentWorkspaces = async (userId) => {
  return Workspace.find({
    $or: [{ owner: userId }, { "members.user": userId }],
    lastOpenedAt: { $ne: null },
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ lastOpenedAt: -1 })
    .limit(20);
};

const getSharedWorkspaces = async (userId) => {
  return Workspace.find({
    owner: { $ne: userId },
    "members.user": userId,
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ updatedAt: -1 });
};

const getWorkspaceById = async ({ workspaceId, userId }) => {
  return Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar");
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

  if (!workspace) return null;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Workspace name is required");
    }

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

const deleteWorkspace = async ({ workspaceId, userId }) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    owner: userId,
  });

  if (!workspace) return null;

  await File.deleteMany({ workspace: workspaceId });
  await workspace.deleteOne();

  return workspace;
};

const markWorkspaceOpened = async ({ workspaceId, userId }) => {
  return Workspace.findOneAndUpdate(
    {
      _id: workspaceId,
      $or: [{ owner: userId }, { "members.user": userId }],
    },
    { $set: { lastOpenedAt: new Date() } },
    { returnDocument: "after" }
  );
};


const getWorkspaceFiles = async ({ workspaceId, userId }) => {
  if (!mongoose.isValidObjectId(workspaceId)) {
    return null;
  }

  const workspace = await getWorkspaceForMember(
    workspaceId,
    userId
  );

  if (!workspace) {
    return null;
  }

  return File.find({ workspace: workspaceId })
    .populate("createdBy", "username email avatar")
    .populate("updatedBy", "username email avatar")
    .sort({ path: 1, type: 1, name: 1 })
    .lean();
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
  const workspace = await getWorkspaceForMember(
    workspaceId,
    userId
  );

  if (!workspace) return null;

  if (!canEditWorkspace(workspace, userId)) {
    return { forbidden: true };
  }

  if (!isValidName(name)) {
    throw new Error("A valid file or folder name is required");
  }

  const fileName = name.trim();
  const fileType = type || "file";

  if (!["file", "folder"].includes(fileType)) {
    throw new Error("Invalid file type");
  }

  if (content !== undefined && typeof content !== "string") {
    throw new Error("File content must be a string");
  }

  if (language !== undefined && language !== null &&
      typeof language !== "string") {
    throw new Error("File language must be a string");
  }

  let parentFolder = null;

  if (parent) {
    parentFolder = await File.findOne({
      _id: parent,
      workspace: workspaceId,
      type: "folder",
    });

    if (!parentFolder) {
      throw new Error("Parent folder not found");
    }
  }

  const expectedPath = parentFolder
    ? `${parentFolder.path}/${fileName}`
    : fileName;

  if (path !== undefined && path !== null && path !== "") {
    const normalizedPath = normalizePath(path);

    if (normalizedPath !== expectedPath) {
      throw new Error(
        "File path does not match its name and parent folder"
      );
    }
  }

  const existingFile = await File.findOne({
    workspace: workspaceId,
    path: expectedPath,
  }).select("_id");

  if (existingFile) {
    const error = new Error(
      "A file or folder already exists at this path"
    );
    error.code = 11000;
    throw error;
  }

  return File.create({
    workspace: workspaceId,
    name: fileName,
    path: expectedPath,
    type: fileType,
    language:
      fileType === "file" ? language || null : null,
    content:
      fileType === "file" ? content ?? "" : "",
    parent: parentFolder?._id || null,
    createdBy: userId,
    updatedBy: userId,
  });
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
  const workspace = await getWorkspaceForMember(
    workspaceId,
    userId
  );

  if (!workspace) return null;

  if (!canEditWorkspace(workspace, userId)) {
    return { forbidden: true };
  }

  const file = await File.findOne({
    _id: fileId,
    workspace: workspaceId,
  });

  if (!file) return { fileNotFound: true };

  if (name !== undefined && !isValidName(name)) {
    throw new Error("A valid file or folder name is required");
  }

  if (path !== undefined && typeof path !== "string") {
    throw new Error("File path must be a string");
  }

  if (content !== undefined && typeof content !== "string") {
    throw new Error("File content must be a string");
  }

  if (
    language !== undefined &&
    language !== null &&
    typeof language !== "string"
  ) {
    throw new Error("File language must be a string");
  }

  if (file.type === "folder" && content !== undefined) {
    throw new Error("Folders cannot contain file content");
  }

  const oldPath = file.path;
  const oldName = file.name;

  const newName =
    name !== undefined ? name.trim() : oldName;

  // Explicit path changes are not supported for folders here.
  // Folder moves require updating parent references as well.
  if (file.type === "folder" && path !== undefined) {
    throw new Error(
      "Folder paths are managed by their names and parents"
    );
  }

  let newPath = oldPath;

  if (file.type === "folder" && newName !== oldName) {
    newPath = oldPath.includes("/")
      ? `${oldPath.slice(0, oldPath.lastIndexOf("/"))}/${newName}`
      : newName;
  } else if (file.type === "file") {
    if (name !== undefined) {
      const parentPath = oldPath.includes("/")
        ? oldPath.slice(0, oldPath.lastIndexOf("/"))
        : "";

      newPath = parentPath
        ? `${parentPath}/${newName}`
        : newName;
    }

    if (path !== undefined) {
      const normalizedPath = normalizePath(path);

      if (!normalizedPath) {
        throw new Error("A valid file path is required");
      }

      // Don't allow the path to disagree with the file name.
      const pathName = normalizedPath.split("/").pop();

      if (name === undefined && pathName !== oldName) {
        throw new Error(
          "File path must end with the file name"
        );
      }

      if (name !== undefined && pathName !== newName) {
        throw new Error(
          "File path must end with the new file name"
        );
      }

      newPath = normalizedPath;
    }
  }

  if (newPath !== oldPath) {
    const descendants =
      file.type === "folder"
        ? await getWorkspaceSubtree(workspaceId, oldPath)
        : [];

    const pathUpdates = descendants.map((child) => ({
      id: child._id,
      oldPath: child.path,
      newPath:
        newPath + child.path.substring(oldPath.length),
    }));

    const targetPaths = [
      newPath,
      ...pathUpdates.map((entry) => entry.newPath),
    ];

    // Reject conflicts outside the renamed subtree.
    const subtreeIds = [
      file._id,
      ...descendants.map((child) => child._id),
    ];

    const conflict = await File.findOne({
      workspace: workspaceId,
      path: { $in: targetPaths },
      _id: { $nin: subtreeIds },
    }).select("path");

    if (conflict) {
      const error = new Error(
        `A file or folder already exists at "${conflict.path}"`
      );
      error.code = 11000;
      throw error;
    }

    // The unique path index means paths cannot always be swapped
    // directly. Use temporary unique paths before final paths.
    const token = require("crypto").randomUUID();

    const allUpdates = [
      { document: file, targetPath: newPath },
      ...pathUpdates.map((entry) => ({
        document: descendants.find(
          (child) => child._id.toString() === entry.id.toString()
        ),
        targetPath: entry.newPath,
      })),
    ];

    // Temporary paths avoid collisions within the renamed subtree.
    await File.bulkWrite(
      allUpdates.map(({ document }, index) => ({
        updateOne: {
          filter: {
            _id: document._id,
            workspace: workspaceId,
          },
          update: {
            $set: {
              path: `__rename_${token}_${index}`,
            },
          },
        },
      }))
    );

    // Update names and restore the intended final paths.
    await File.bulkWrite(
      allUpdates.map(({ document, targetPath }) => ({
        updateOne: {
          filter: {
            _id: document._id,
            workspace: workspaceId,
          },
          update: {
            $set: {
              path: targetPath,
              updatedBy: userId,
              ...(document._id.toString() === file._id.toString()
                ? { name: newName }
                : {}),
            },
          },
        },
      }))
    );

    file.path = newPath;
    file.name = newName;
  } else if (name !== undefined) {
    file.name = newName;
  }

  if (language !== undefined) {
    file.language = language;
  }

  if (content !== undefined) {
    file.content = content;
  }

  file.updatedBy = userId;

  if (newPath === oldPath) {
    await file.save();
  }

  return file;
};

const deleteWorkspaceFile = async ({
  workspaceId,
  userId,
  fileId,
}) => {
  const workspace = await getWorkspaceForMember(
    workspaceId,
    userId
  );

  if (!workspace) return null;

  if (!canEditWorkspace(workspace, userId)) {
    return { forbidden: true };
  }

  const file = await File.findOne({
    _id: fileId,
    workspace: workspaceId,
  });

  if (!file) {
    return { fileNotFound: true };
  }

  const deletedFiles =
    file.type === "folder"
      ? await getWorkspaceSubtree(workspaceId, file.path)
      : [];

  const deletedIds = [
    file._id,
    ...deletedFiles.map((child) => child._id),
  ];

  const result = await File.deleteMany({
    workspace: workspaceId,
    _id: { $in: deletedIds },
  });

  return {
    success: true,
    deletedCount: result.deletedCount,
    fileIds: deletedIds.map((id) => id.toString()),
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

  if (!workspace) return null;

  if (!["editor", "viewer"].includes(role)) {
    return { invalidRole: true };
  }

  const memberUser = await User.findById(memberUserId);

  if (!memberUser) return { userNotFound: true };

  if (workspace.owner.toString() === memberUserId.toString()) {
    return { ownerCannotBeAdded: true };
  }

  const existingMember = workspace.members.find(
    (member) =>
      member.user &&
      member.user.toString() === memberUserId.toString()
  );

  if (existingMember) return { alreadyMember: true };

  workspace.members.push({
    user: memberUserId,
    role,
  });

  await workspace.save();

  await workspace.populate("members.user", "username email avatar");

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

  if (!workspace) return null;

  if (!["editor", "viewer"].includes(role)) {
    return { invalidRole: true };
  }

  if (workspace.owner.toString() === memberUserId.toString()) {
    return { ownerCannotBeModified: true };
  }

  const member = workspace.members.find(
    (entry) =>
      entry.user &&
      entry.user.toString() === memberUserId.toString()
  );

  if (!member) return { memberNotFound: true };

  member.role = role;

  await workspace.save();

  await workspace.populate("members.user", "username email avatar");

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

  if (!workspace) return null;

  if (workspace.owner.toString() === memberUserId.toString()) {
    return { ownerCannotBeRemoved: true };
  }

  const memberIndex = workspace.members.findIndex(
    (entry) =>
      entry.user &&
      entry.user.toString() === memberUserId.toString()
  );

  if (memberIndex === -1) return { memberNotFound: true };

  workspace.members.splice(memberIndex, 1);
  await workspace.save();

  return { success: true };
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