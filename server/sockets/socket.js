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

  const pendingSaves = new Map();

  /*
   * SOCKET AUTHENTICATION
   */
  io.use((socket, next) => {
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

      socket.user = {
        userId: decoded.userId,
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
   * DEBOUNCED FILE SAVE
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
      (existingSave?.revision || 0) + 1;

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

        if (
          !currentSave ||
          currentSave.revision !==
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
            `File saved | Workspace: ${workspaceId} | File: ${fileId} | User: ${currentSave.userId} | Revision: ${revision}`
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
            "File persistence error:",
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
  const getCollaboratorInfo = async ({
    workspace,
    userId,
  }) => {
    const user =
      await User.findById(userId).select(
        "username avatar"
      );

    if (!user) {
      return null;
    }

    /*
     * Workspace owner
     */
    const isOwner =
      workspace.owner.toString() ===
      userId.toString();

    if (isOwner) {
      return {
        userId:
          user._id.toString(),

        username:
          user.username,

        avatar:
          user.avatar,

        role: "owner",
      };
    }

    /*
     * Workspace member
     */
    const member =
      workspace.members.find(
        (member) =>
          member.user?.toString() ===
          userId.toString()
      );

    if (!member) {
      return null;
    }

    return {
      userId:
        user._id.toString(),

      username:
        user.username,

      avatar:
        user.avatar,

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

          /*
           * Verify workspace access
           */
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

          /*
           * Find existing collaborators
           */
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
                  await getCollaboratorInfo({
                    workspace,
                    userId:
                      existingSocket
                        .user.userId,
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

          /*
           * Join room
           */
          socket.join(roomName);

          /*
           * Determine current user's role
           */
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

          /*
           * Store workspace access
           * and active file
           */
          socket.workspaceAccess = {
            workspaceId:
              workspaceId.toString(),

            role,

            activeFileId: null,
          };

          /*
           * Tell current user about
           * existing collaborators
           */
          socket.emit(
            "workspace:joined",
            {
              workspaceId,
              role,
              users: existingUsers,
            }
          );

          /*
           * Get current user profile
           */
          const currentUser =
            await getCollaboratorInfo({
              workspace,

              userId:
                socket.user.userId,
            });

          /*
           * Notify other collaborators
           */
          if (currentUser) {
            socket
              .to(roomName)
              .emit(
                "workspace:user-joined",
                {
                  ...currentUser,

                  activeFileId:
                    null,
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

        const roomName =
          `workspace:${workspaceId}`;

        /*
         * Notify remaining users
         */
        socket
          .to(roomName)
          .emit(
            "workspace:user-left",
            {
              userId:
                socket.user.userId,
            }
          );

        /*
         * Leave room
         */
        socket.leave(roomName);

        /*
         * Clear cached workspace data
         */
        if (
          socket.workspaceAccess
            ?.workspaceId ===
          workspaceId.toString()
        ) {
          socket.workspaceAccess = null;
        }

        console.log(
          `User ${socket.user.userId} left workspace ${workspaceId}`
        );
      }
    );

    /*
     * ACTIVE FILE
     *
     * Called when the user opens/selects
     * a file in the editor.
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

          /*
           * Verify workspace membership
           */
          const workspaceAccess =
            socket.workspaceAccess;

          if (
            !workspaceAccess ||
            workspaceAccess.workspaceId !==
              workspaceId.toString()
          ) {
            return;
          }

          /*
           * Verify file belongs
           * to this workspace.
           */
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

          /*
           * Store active file
           */
          socket.workspaceAccess.activeFileId =
            fileId.toString();

          const roomName =
            `workspace:${workspaceId}`;

          /*
           * Notify other collaborators
           */
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
     * FILE CHANGE
     */
    socket.on(
      "file:change",
      async ({
        workspaceId,
        fileId,
        content,
      }) => {
        try {
          /*
           * Validate data
           */
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

          /*
           * Verify socket joined
           * this workspace
           */
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

          /*
           * Get cached role
           */
          const role =
            workspaceAccess.role;

          /*
           * Only owner/editor
           * can modify files
           */
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

          /*
           * Verify file belongs
           * to workspace
           */
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

          /*
           * Broadcast immediately
           */
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

          /*
           * Persist after debounce
           */
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