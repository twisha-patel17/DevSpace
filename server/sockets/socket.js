const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");
const User = require("../models/user.model");

const {
  updateFileContent,
} = require("../services/file.service");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  /*
   * Pending debounced saves.
   *
   * key:
   * workspaceId:fileId
   *
   * Each entry contains:
   * - content
   * - userId
   * - revision
   * - timer
   */
  const pendingSaves = new Map();

  /*
   * Used to make manual saves authoritative.
   *
   * Whenever a manual save happens, the revision for that
   * file is incremented. Any older debounced save becomes stale.
   */
  const fileRevisions = new Map();

  /*
   * SOCKET AUTHENTICATION
   */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication token required"
          )
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user =
        await User.findById(
          decoded.userId
        ).select("username avatar");

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      socket.user = {
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
      };

      next();
    } catch (error) {
      console.error(
        "Socket authentication failed:",
        error.message
      );

      next(
        new Error(
          "Invalid authentication token"
        )
      );
    }
  });

  /*
   * GET CURRENT FILE REVISION
   */
  const getFileRevision = (saveKey) => {
    return fileRevisions.get(saveKey) || 0;
  };

  /*
   * INCREMENT FILE REVISION
   */
  const incrementFileRevision = (saveKey) => {
    const nextRevision =
      getFileRevision(saveKey) + 1;

    fileRevisions.set(
      saveKey,
      nextRevision
    );

    return nextRevision;
  };

  /*
   * CANCEL PENDING SAVE
   */
  const cancelPendingSave = (saveKey) => {
    const pendingSave =
      pendingSaves.get(saveKey);

    if (!pendingSave) {
      return;
    }

    if (pendingSave.timer) {
      clearTimeout(
        pendingSave.timer
      );
    }

    pendingSaves.delete(saveKey);
  };

  /*
   * DEBOUNCED FILE SAVE
   *
   * Called while the user is typing.
   *
   * The file is persisted only after the user
   * stops typing for 700ms.
   */
  const scheduleFileSave = ({
    workspaceId,
    fileId,
    content,
    userId,
  }) => {
    const saveKey =
      `${workspaceId}:${fileId}`;

    const existingSave =
      pendingSaves.get(saveKey);

    if (existingSave?.timer) {
      clearTimeout(
        existingSave.timer
      );
    }

    const revision =
      incrementFileRevision(
        saveKey
      );

    const saveState = {
      content,
      userId,
      revision,
      timer: null,
    };

    saveState.timer = setTimeout(
      async () => {
        const currentSave =
          pendingSaves.get(saveKey);

        /*
         * The save is no longer valid.
         *
         * This can happen when:
         * - another keystroke arrived
         * - a manual save happened
         */
        if (
          !currentSave ||
          currentSave.revision !==
            revision ||
          getFileRevision(saveKey) !==
            revision
        ) {
          return;
        }

        try {
          await updateFileContent({
            workspaceId,
            fileId,
            content:
              currentSave.content,
            userId:
              currentSave.userId,
          });

          console.log(
            `File autosaved | Workspace: ${workspaceId} | File: ${fileId} | User: ${currentSave.userId} | Revision: ${revision}`
          );

          const latestSave =
            pendingSaves.get(saveKey);

          if (
            latestSave &&
            latestSave.revision ===
              revision
          ) {
            pendingSaves.delete(
              saveKey
            );
          }
        } catch (error) {
          console.error(
            "File autosave error:",
            error
          );

          const latestSave =
            pendingSaves.get(saveKey);

          if (
            latestSave &&
            latestSave.revision ===
              revision
          ) {
            pendingSaves.delete(
              saveKey
            );
          }
        }
      },
      700
    );

    pendingSaves.set(
      saveKey,
      saveState
    );
  };

  /*
   * GET COLLABORATOR INFORMATION
   */
  const getCollaboratorInfo = ({
    workspace,
    socketUser,
  }) => {
    const userId =
      socketUser.userId.toString();

    const isOwner =
      workspace.owner.toString() ===
      userId;

    if (isOwner) {
      return {
        userId,
        username:
          socketUser.username,
        avatar:
          socketUser.avatar,
        role: "owner",
      };
    }

    const member =
      workspace.members.find(
        (member) =>
          member.user?.toString() ===
          userId
      );

    if (!member) {
      return null;
    }

    return {
      userId,
      username:
        socketUser.username,
      avatar:
        socketUser.avatar,
      role:
        member.role,
    };
  };

  /*
   * SOCKET CONNECTION
   */
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.userId}`
    );

    /*
     * JOIN WORKSPACE
     */
    socket.on(
      "workspace:join",
      async ({ workspaceId }) => {
        try {
          if (!workspaceId) {
            socket.emit(
              "workspace:error",
              {
                message:
                  "Workspace ID is required",
              }
            );

            return;
          }

          const requestedWorkspaceId =
            workspaceId.toString();

          if (
            socket.workspaceAccess
              ?.workspaceId ===
            requestedWorkspaceId
          ) {
            return;
          }

          if (
            socket.workspaceAccess
              ?.workspaceId
          ) {
            const previousWorkspaceId =
              socket.workspaceAccess
                .workspaceId;

            const previousRoom =
              `workspace:${previousWorkspaceId}`;

            socket
              .to(previousRoom)
              .emit(
                "workspace:user-left",
                {
                  userId:
                    socket.user.userId,
                }
              );

            socket.leave(
              previousRoom
            );

            socket.workspaceAccess =
              null;
          }

          const workspace =
            await Workspace.findOne({
              _id: workspaceId,

              $or: [
                {
                  owner:
                    socket.user.userId,
                },
                {
                  "members.user":
                    socket.user.userId,
                },
              ],
            });

          if (!workspace) {
            socket.emit(
              "workspace:error",
              {
                message:
                  "Workspace not found or access denied",
              }
            );

            return;
          }

          const roomName =
            `workspace:${workspaceId}`;

          const existingUsers = [];

          const room =
            io.sockets.adapter.rooms.get(
              roomName
            );

          if (room) {
            for (
              const socketId of room
            ) {
              const existingSocket =
                io.sockets.sockets.get(
                  socketId
                );

              if (
                existingSocket?.user
                  ?.userId
              ) {
                const collaborator =
                  getCollaboratorInfo({
                    workspace,
                    socketUser:
                      existingSocket.user,
                  });

                if (collaborator) {
                  existingUsers.push({
                    ...collaborator,

                    activeFileId:
                      existingSocket
                        .workspaceAccess
                        ?.activeFileId ||
                      null,
                  });
                }
              }
            }
          }

          socket.join(roomName);

          const isOwner =
            workspace.owner.toString() ===
            socket.user.userId.toString();

          const member =
            workspace.members.find(
              (member) =>
                member.user?.toString() ===
                socket.user.userId.toString()
            );

          const role = isOwner
            ? "owner"
            : member?.role;

          socket.workspaceAccess = {
            workspaceId:
              workspaceId.toString(),

            role,

            activeFileId: null,
          };

          socket.emit(
            "workspace:joined",
            {
              workspaceId,
              role,
              users: existingUsers,
            }
          );

          const currentUser =
            getCollaboratorInfo({
              workspace,
              socketUser:
                socket.user,
            });

          if (currentUser) {
            socket
              .to(roomName)
              .emit(
                "workspace:user-joined",
                {
                  ...currentUser,

                  activeFileId: null,
                }
              );
          }

          console.log(
            `User ${socket.user.userId} joined workspace ${workspaceId} | Role: ${role}`
          );
        } catch (error) {
          console.error(
            "Workspace join error:",
            error
          );

          socket.emit(
            "workspace:error",
            {
              message:
                "Failed to join workspace",
            }
          );
        }
      }
    );

    /*
     * LEAVE WORKSPACE
     */
    socket.on(
      "workspace:leave",
      ({ workspaceId }) => {
        if (!workspaceId) {
          return;
        }

        const requestedWorkspaceId =
          workspaceId.toString();

        if (
          socket.workspaceAccess
            ?.workspaceId !==
          requestedWorkspaceId
        ) {
          return;
        }

        const roomName =
          `workspace:${requestedWorkspaceId}`;

        socket
          .to(roomName)
          .emit(
            "workspace:user-left",
            {
              userId:
                socket.user.userId,
            }
          );

        socket.leave(roomName);

        socket.workspaceAccess =
          null;

        console.log(
          `User ${socket.user.userId} left workspace ${workspaceId}`
        );
      }
    );

    /*
     * FILE OPEN
     */
    socket.on(
      "file:open",
      async ({
        workspaceId,
        fileId,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId
          ) {
            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            return;
          }

          const file =
            await File.findOne({
              _id: fileId,

              workspace:
                workspaceId,

              type: "file",
            });

          if (!file) {
            return;
          }

          socket.workspaceAccess.activeFileId =
            fileId.toString();

          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "workspace:user-file-changed",
              {
                userId:
                  socket.user.userId,

                fileId:
                  fileId.toString(),
              }
            );

          console.log(
            `User ${socket.user.userId} opened file ${fileId} in workspace ${workspaceId}`
          );
        } catch (error) {
          console.error(
            "Active file error:",
            error
          );
        }
      }
    );

    /*
     * FILE CONTENT CHANGE
     *
     * Used while typing.
     *
     * 1. Broadcast immediately.
     * 2. Schedule debounced persistence.
     */
    socket.on(
      "file:change",
      async ({
        workspaceId,
        fileId,
        content,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId ||
            typeof content !== "string"
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "Invalid file change data",
              }
            );

            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "You have not joined this workspace",
              }
            );

            return;
          }

          const role =
            workspaceAccess.role;

          if (
            role !== "owner" &&
            role !== "editor"
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "You do not have permission to edit this file",
              }
            );

            return;
          }

          const file =
            await File.findOne({
              _id: fileId,

              workspace:
                workspaceId,

              type: "file",
            });

          if (!file) {
            socket.emit(
              "file:error",
              {
                message:
                  "File not found in this workspace",
              }
            );

            return;
          }

          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "file:changed",
              {
                workspaceId,

                fileId,

                content,

                userId:
                  socket.user.userId,
              }
            );

          scheduleFileSave({
            workspaceId,

            fileId,

            content,

            userId:
              socket.user.userId,
          });

          console.log(
            `File changed | Workspace: ${workspaceId} | File: ${fileId} | User: ${socket.user.userId} | Role: ${role}`
          );
        } catch (error) {
          console.error(
            "File change error:",
            error
          );

          socket.emit(
            "file:error",
            {
              message:
                "Failed to process file change",
            }
          );
        }
      }
    );

    /*
     * MANUAL FILE SAVE
     *
     * This is now the authoritative save path.
     *
     * The client will send the complete current
     * editor content here when Save is clicked.
     *
     * Any pending autosave for this file is
     * cancelled first.
     */
    socket.on(
      "file:save",
      async ({
        workspaceId,
        fileId,
        content,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId ||
            typeof content !== "string"
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "Invalid file save data",
              }
            );

            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "You have not joined this workspace",
              }
            );

            return;
          }

          const role =
            workspaceAccess.role;

          if (
            role !== "owner" &&
            role !== "editor"
          ) {
            socket.emit(
              "file:error",
              {
                message:
                  "You do not have permission to save this file",
              }
            );

            return;
          }

          const file =
            await File.findOne({
              _id: fileId,

              workspace:
                workspaceId,

              type: "file",
            });

          if (!file) {
            socket.emit(
              "file:error",
              {
                message:
                  "File not found in this workspace",
              }
            );

            return;
          }

          const saveKey =
            `${workspaceId}:${fileId}`;

          /*
           * Cancel any pending autosave.
           */
          cancelPendingSave(saveKey);

          /*
           * Advance revision so an already-running
           * stale autosave cannot be considered valid.
           */
          const manualRevision =
            incrementFileRevision(
              saveKey
            );

          /*
           * Persist immediately.
           */
          await updateFileContent({
            workspaceId,

            fileId,

            content,

            userId:
              socket.user.userId,
          });

          console.log(
            `File manually saved | Workspace: ${workspaceId} | File: ${fileId} | User: ${socket.user.userId} | Revision: ${manualRevision}`
          );

          /*
           * Notify all other collaborators.
           */
          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "file:changed",
              {
                workspaceId,

                fileId,

                content,

                userId:
                  socket.user.userId,

                saved: true,
              }
            );

          /*
           * Confirm save to the client that
           * performed the manual save.
           */
          socket.emit(
            "file:saved",
            {
              workspaceId,

              fileId,

              content,

              revision:
                manualRevision,
            }
          );
        } catch (error) {
          console.error(
            "Manual file save error:",
            error
          );

          socket.emit(
            "file:error",
            {
              message:
                "Failed to save file",
            }
          );
        }
      }
    );

    /*
     * FILE CREATED
     *
     * This event is emitted by the REST layer
     * after a file/folder has been successfully
     * created.
     */
    socket.on(
      "file:created",
      async ({
        workspaceId,
        fileId,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId
          ) {
            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            return;
          }

          if (
            workspaceAccess.role !==
              "owner" &&
            workspaceAccess.role !==
              "editor"
          ) {
            return;
          }

          const file =
            await File.findOne({
              _id: fileId,
              workspace: workspaceId,
            }).lean();

          if (!file) {
            return;
          }

          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "workspace:file-created",
              {
                workspaceId:
                  workspaceId.toString(),

                file,

                userId:
                  socket.user.userId,
              }
            );
        } catch (error) {
          console.error(
            "File created event error:",
            error
          );
        }
      }
    );

    /*
     * FILE UPDATED
     *
     * Used for rename/move/language changes
     * performed through REST.
     */
    socket.on(
      "file:updated",
      async ({
        workspaceId,
        fileId,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId
          ) {
            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            return;
          }

          if (
            workspaceAccess.role !==
              "owner" &&
            workspaceAccess.role !==
              "editor"
          ) {
            return;
          }

          const file =
            await File.findOne({
              _id: fileId,
              workspace: workspaceId,
            }).lean();

          if (!file) {
            return;
          }

          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "workspace:file-updated",
              {
                workspaceId:
                  workspaceId.toString(),

                file,

                userId:
                  socket.user.userId,
              }
            );
        } catch (error) {
          console.error(
            "File updated event error:",
            error
          );
        }
      }
    );

    /*
     * FILE DELETED
     */
    socket.on(
      "file:deleted",
      async ({
        workspaceId,
        fileId,
      }) => {
        try {
          if (
            !workspaceId ||
            !fileId
          ) {
            return;
          }

          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            return;
          }

          if (
            workspaceAccess.role !==
              "owner" &&
            workspaceAccess.role !==
              "editor"
          ) {
            return;
          }

          /*
           * Remove any pending save associated
           * with the deleted file.
           */
          const saveKey =
            `${workspaceId}:${fileId}`;

          cancelPendingSave(saveKey);

          fileRevisions.delete(
            saveKey
          );

          const roomName =
            `workspace:${workspaceId}`;

          socket
            .to(roomName)
            .emit(
              "workspace:file-deleted",
              {
                workspaceId:
                  workspaceId.toString(),

                fileId:
                  fileId.toString(),

                userId:
                  socket.user.userId,
              }
            );
        } catch (error) {
          console.error(
            "File deleted event error:",
            error
          );
        }
      }
    );

    /*
     * DISCONNECT
     */
    socket.on("disconnect", () => {
      const workspaceAccess =
        socket.workspaceAccess;

      if (
        workspaceAccess?.workspaceId
      ) {
        const roomName =
          `workspace:${workspaceAccess.workspaceId}`;

        socket
          .to(roomName)
          .emit(
            "workspace:user-left",
            {
              userId:
                socket.user.userId,
            }
          );

        console.log(
          `User ${socket.user.userId} disconnected from workspace ${workspaceAccess.workspaceId}`
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