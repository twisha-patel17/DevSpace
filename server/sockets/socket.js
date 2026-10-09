const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");
const User = require("../models/user.model");

const { updateFileContent } = require("../services/file.service");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Pending debounced saves, keyed by workspaceId:fileId.
  const pendingSaves = new Map();
  const fileRevisions = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const accessSecret = process.env.JWT_ACCESS_SECRET;

      if (!accessSecret) {
        console.error(
          "Socket authentication failed: JWT_ACCESS_SECRET is not configured"
        );

        return next(
          new Error("Server authentication configuration error")
        );
      }

      const decoded = jwt.verify(token, accessSecret);

      if (!decoded.userId) {
        return next(new Error("Invalid authentication token"));
      }

      const user = await User.findById(decoded.userId).select(
        "username avatar"
      );

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = {
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
      };

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);

      next(
        new Error(
          error.name === "TokenExpiredError"
            ? "Access token expired"
            : "Invalid authentication token"
        )
      );
    }
  });

  const getFileRevision = (saveKey) =>
    fileRevisions.get(saveKey) || 0;

  const incrementFileRevision = (saveKey) => {
    const revision = getFileRevision(saveKey) + 1;
    fileRevisions.set(saveKey, revision);
    return revision;
  };

  const cancelPendingSave = (saveKey) => {
    const pendingSave = pendingSaves.get(saveKey);

    if (!pendingSave) return;

    if (pendingSave.timer) {
      clearTimeout(pendingSave.timer);
    }

    pendingSaves.delete(saveKey);
  };

  const scheduleFileSave = ({
    workspaceId,
    fileId,
    content,
    userId,
  }) => {
    const saveKey = `${workspaceId}:${fileId}`;
    const existingSave = pendingSaves.get(saveKey);

    if (existingSave?.timer) {
      clearTimeout(existingSave.timer);
    }

    const revision = incrementFileRevision(saveKey);

    const saveState = {
      content,
      userId,
      revision,
      timer: null,
    };

    saveState.timer = setTimeout(async () => {
      const currentSave = pendingSaves.get(saveKey);

      if (
        !currentSave ||
        currentSave.revision !== revision ||
        getFileRevision(saveKey) !== revision
      ) {
        return;
      }

      try {
        await updateFileContent({
          workspaceId,
          fileId,
          content: currentSave.content,
          userId: currentSave.userId,
        });

        console.log(
          `File autosaved | Workspace: ${workspaceId} | File: ${fileId} | Revision: ${revision}`
        );

        const latestSave = pendingSaves.get(saveKey);

        if (latestSave?.revision === revision) {
          pendingSaves.delete(saveKey);
        }
      } catch (error) {
        console.error("File autosave error:", error);

        const latestSave = pendingSaves.get(saveKey);

        if (latestSave?.revision === revision) {
          pendingSaves.delete(saveKey);
        }
      }
    }, 700);

    pendingSaves.set(saveKey, saveState);
  };

  const getCollaboratorInfo = ({ workspace, socketUser }) => {
    const userId = socketUser.userId.toString();
    const ownerId = workspace.owner.toString();
    const isOwner = ownerId === userId;

    if (isOwner) {
      return {
        userId,
        username: socketUser.username,
        avatar: socketUser.avatar,
        role: "owner",
      };
    }

    const member = workspace.members.find(
      (item) => item.user?.toString() === userId
    );

    if (!member) return null;

    return {
      userId,
      username: socketUser.username,
      avatar: socketUser.avatar,
      role: member.role,
    };
  };

  const getWorkspaceAccess = (socket, workspaceId) => {
    const access = socket.workspaceAccess;

    if (
      !access ||
      access.workspaceId !== String(workspaceId)
    ) {
      return null;
    }

    return access;
  };

  const canEdit = (access) =>
    access &&
    (access.role === "owner" || access.role === "editor");

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.userId}`
    );

    socket.on("workspace:join", async ({ workspaceId } = {}) => {
      try {
        if (!workspaceId) {
          socket.emit("workspace:error", {
            message: "Workspace ID is required",
          });
          return;
        }

        const requestedWorkspaceId = String(workspaceId);

        if (
          socket.workspaceAccess?.workspaceId ===
          requestedWorkspaceId
        ) {
          return;
        }

        // Leave a previous workspace if necessary.
        if (socket.workspaceAccess?.workspaceId) {
          const previousWorkspaceId =
            socket.workspaceAccess.workspaceId;

          const previousRoom = `workspace:${previousWorkspaceId}`;

          socket.to(previousRoom).emit("workspace:user-left", {
            userId: socket.user.userId,
          });

          socket.leave(previousRoom);
          socket.workspaceAccess = null;
        }

        const workspace = await Workspace.findOne({
          _id: workspaceId,
          $or: [
            { owner: socket.user.userId },
            { "members.user": socket.user.userId },
          ],
        });

        if (!workspace) {
          socket.emit("workspace:error", {
            message: "Workspace not found or access denied",
          });
          return;
        }

        const isOwner =
          workspace.owner.toString() === socket.user.userId;

        const member = workspace.members.find(
          (item) =>
            item.user?.toString() === socket.user.userId
        );

        const role = isOwner ? "owner" : member?.role;

        if (!role) {
          socket.emit("workspace:error", {
            message: "Workspace access denied",
          });
          return;
        }

        const roomName = `workspace:${requestedWorkspaceId}`;

        const existingUsers = [];
        const room = io.sockets.adapter.rooms.get(roomName);

        if (room) {
          for (const socketId of room) {
            const existingSocket = io.sockets.sockets.get(socketId);

            if (!existingSocket?.user?.userId) continue;

            const collaborator = getCollaboratorInfo({
              workspace,
              socketUser: existingSocket.user,
            });

            if (!collaborator) continue;

            const existingIndex = existingUsers.findIndex(
              (user) => user.userId === collaborator.userId
            );

            const onlineUser = {
              ...collaborator,
              activeFileId:
                existingSocket.workspaceAccess?.activeFileId || null,
            };

            if (existingIndex === -1) {
              existingUsers.push(onlineUser);
            } else if (onlineUser.activeFileId) {
              existingUsers[existingIndex] = onlineUser;
            }
          }
        }

        socket.join(roomName);

        socket.workspaceAccess = {
          workspaceId: requestedWorkspaceId,
          role,
          activeFileId: null,
        };

        socket.emit("workspace:joined", {
          workspaceId: requestedWorkspaceId,
          role,
          users: existingUsers,
        });

        const currentUser = getCollaboratorInfo({
          workspace,
          socketUser: socket.user,
        });

        if (currentUser) {
          socket.to(roomName).emit("workspace:user-joined", {
            ...currentUser,
            activeFileId: null,
          });
        }

        console.log(
          `User ${socket.user.userId} joined workspace ${workspaceId} | Role: ${role}`
        );
      } catch (error) {
        console.error("Workspace join error:", error);

        socket.emit("workspace:error", {
          message: "Failed to join workspace",
        });
      }
    });

    socket.on("workspace:leave", ({ workspaceId } = {}) => {
      if (!workspaceId) return;

      const requestedWorkspaceId = String(workspaceId);
      const access = getWorkspaceAccess(socket, requestedWorkspaceId);

      if (!access) return;

      const roomName = `workspace:${requestedWorkspaceId}`;

      socket.to(roomName).emit("workspace:user-left", {
        userId: socket.user.userId,
      });

      socket.leave(roomName);
      socket.workspaceAccess = null;

      console.log(
        `User ${socket.user.userId} left workspace ${workspaceId}`
      );
    });

    socket.on("file:open", async ({ workspaceId, fileId } = {}) => {
      try {
        if (!workspaceId || !fileId) return;

        const access = getWorkspaceAccess(socket, workspaceId);

        if (!access) return;

        const file = await File.findOne({
          _id: fileId,
          workspace: workspaceId,
          type: "file",
        }).select("_id");

        if (!file) return;

        access.activeFileId = file._id.toString();

        socket.to(`workspace:${workspaceId}`).emit(
          "workspace:user-file-changed",
          {
            userId: socket.user.userId,
            activeFileId: file._id.toString(),
          }
        );
      } catch (error) {
        console.error("Active file error:", error);
      }
    });

    socket.on(
      "file:change",
      async ({ workspaceId, fileId, content } = {}) => {
        try {
          if (
            !workspaceId ||
            !fileId ||
            typeof content !== "string"
          ) {
            socket.emit("file:error", {
              message: "Invalid file change data",
            });
            return;
          }

          const access = getWorkspaceAccess(socket, workspaceId);

          if (!access) {
            socket.emit("file:error", {
              message: "You have not joined this workspace",
            });
            return;
          }

          if (!canEdit(access)) {
            socket.emit("file:error", {
              message: "You do not have permission to edit this file",
            });
            return;
          }

          const file = await File.findOne({
            _id: fileId,
            workspace: workspaceId,
            type: "file",
          }).select("_id");

          if (!file) {
            socket.emit("file:error", {
              message: "File not found in this workspace",
            });
            return;
          }

          const normalizedFileId = file._id.toString();
          const normalizedWorkspaceId = String(workspaceId);

          socket.to(`workspace:${normalizedWorkspaceId}`).emit(
            "file:changed",
            {
              workspaceId: normalizedWorkspaceId,
              fileId: normalizedFileId,
              content,
              userId: socket.user.userId,
            }
          );

          scheduleFileSave({
            workspaceId: normalizedWorkspaceId,
            fileId: normalizedFileId,
            content,
            userId: socket.user.userId,
          });
        } catch (error) {
          console.error("File change error:", error);

          socket.emit("file:error", {
            message: "Failed to process file change",
          });
        }
      }
    );

    socket.on(
      "file:save",
      async ({ workspaceId, fileId, content } = {}) => {
        try {
          if (
            !workspaceId ||
            !fileId ||
            typeof content !== "string"
          ) {
            socket.emit("file:error", {
              message: "Invalid file save data",
            });
            return;
          }

          const access = getWorkspaceAccess(socket, workspaceId);

          if (!access) {
            socket.emit("file:error", {
              message: "You have not joined this workspace",
            });
            return;
          }

          if (!canEdit(access)) {
            socket.emit("file:error", {
              message: "You do not have permission to save this file",
            });
            return;
          }

          const file = await File.findOne({
            _id: fileId,
            workspace: workspaceId,
            type: "file",
          }).select("_id");

          if (!file) {
            socket.emit("file:error", {
              message: "File not found in this workspace",
            });
            return;
          }

          const normalizedFileId = file._id.toString();
          const normalizedWorkspaceId = String(workspaceId);
          const saveKey = `${normalizedWorkspaceId}:${normalizedFileId}`;

          cancelPendingSave(saveKey);

          const revision = incrementFileRevision(saveKey);

          await updateFileContent({
            workspaceId: normalizedWorkspaceId,
            fileId: normalizedFileId,
            content,
            userId: socket.user.userId,
          });

          socket.to(`workspace:${normalizedWorkspaceId}`).emit(
            "file:changed",
            {
              workspaceId: normalizedWorkspaceId,
              fileId: normalizedFileId,
              content,
              userId: socket.user.userId,
              saved: true,
            }
          );

          socket.emit("file:saved", {
            workspaceId: normalizedWorkspaceId,
            fileId: normalizedFileId,
            content,
            revision,
          });

          console.log(
            `File manually saved | Workspace: ${normalizedWorkspaceId} | File: ${normalizedFileId} | User: ${socket.user.userId}`
          );
        } catch (error) {
          console.error("Manual file save error:", error);

          socket.emit("file:error", {
            message: "Failed to save file",
          });
        }
      }
    );

    socket.on(
      "file:created",
      async ({ workspaceId, file: incomingFile, fileId } = {}) => {
        try {
          if (!workspaceId) return;

          const access = getWorkspaceAccess(socket, workspaceId);

          if (!access) return;

          if (!canEdit(access)) {
            socket.emit("file:error", {
              message: "You do not have permission to create files",
            });
            return;
          }

          const id = fileId || incomingFile?._id;

          if (!id) return;

          const file = await File.findOne({
            _id: id,
            workspace: workspaceId,
          }).lean();

          if (!file) return;

          socket.to(`workspace:${workspaceId}`).emit(
            "workspace:file-created",
            file
          );
        } catch (error) {
          console.error("File created event error:", error);
        }
      }
    );

    socket.on(
      "file:updated",
      async ({ workspaceId, file: incomingFile, fileId } = {}) => {
        try {
          if (!workspaceId) return;

          const access = getWorkspaceAccess(socket, workspaceId);

          if (!access) return;

          if (!canEdit(access)) {
            socket.emit("file:error", {
              message: "You do not have permission to update files",
            });
            return;
          }

          const id = fileId || incomingFile?._id;

          if (!id) return;

          const file = await File.findOne({
            _id: id,
            workspace: workspaceId,
          }).lean();

          if (!file) return;

          socket.to(`workspace:${workspaceId}`).emit(
            "workspace:file-updated",
            file
          );
        } catch (error) {
          console.error("File updated event error:", error);
        }
      }
    );

    socket.on(
      "file:deleted",
      async ({ workspaceId, fileId, fileIds } = {}) => {
        try {
          if (!workspaceId || !fileId) return;

          const access = getWorkspaceAccess(socket, workspaceId);

          if (!access) return;

          if (!canEdit(access)) {
            socket.emit("file:error", {
              message: "You do not have permission to delete files",
            });
            return;
          }

          const idsToDelete = [
            ...new Set(
              (Array.isArray(fileIds) ? fileIds : [fileId]).map(String)
            ),
          ];

          for (const id of idsToDelete) {
            const saveKey = `${workspaceId}:${id}`;

            cancelPendingSave(saveKey);
            fileRevisions.delete(saveKey);
          }

          socket.to(`workspace:${workspaceId}`).emit(
            "workspace:file-deleted",
            {
              workspaceId: String(workspaceId),
              fileId: String(fileId),
              fileIds: idsToDelete,
              userId: socket.user.userId,
            }
          );
        } catch (error) {
          console.error("File deleted event error:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      const access = socket.workspaceAccess;

      if (access?.workspaceId) {
        socket.to(`workspace:${access.workspaceId}`).emit(
          "workspace:user-left",
          {
            userId: socket.user.userId,
          }
        );

        console.log(
          `User ${socket.user.userId} disconnected from workspace ${access.workspaceId}`
        );
      }

      console.log(
        `Socket disconnected: ${socket.id} | User: ${socket.user.userId}`
      );
    });
  });

  return io;
};

module.exports = initializeSocket;