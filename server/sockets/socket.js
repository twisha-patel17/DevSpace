const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Workspace = require("../models/workspace.model");
const File = require("../models/file.model");

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

  const saveTimers = new Map();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication token required")
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
        new Error("Invalid authentication token")
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.userId}`
    );

    socket.on(
      "workspace:join",
      async ({ workspaceId }) => {
        try {
          if (!workspaceId) {
            socket.emit("workspace:error", {
              message:
                "Workspace ID is required",
            });

            return;
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
            socket.emit("workspace:error", {
              message:
                "Workspace not found or access denied",
            });

            return;
          }

          const roomName =
            `workspace:${workspaceId}`;

          socket.join(roomName);

          socket.emit(
            "workspace:joined",
            {
              workspaceId,
            }
          );

          socket
            .to(roomName)
            .emit(
              "workspace:user-joined",
              {
                userId:
                  socket.user.userId,
              }
            );

          console.log(
            `User ${socket.user.userId} joined workspace ${workspaceId}`
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

    socket.on(
      "workspace:leave",
      ({ workspaceId }) => {
        if (!workspaceId) {
          return;
        }

        const roomName =
          `workspace:${workspaceId}`;

        socket.leave(roomName);

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
          `User ${socket.user.userId} left workspace ${workspaceId}`
        );
      }
    );

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
              "file:error",
              {
                message:
                  "Workspace not found or access denied",
              }
            );

            return;
          }

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
              workspace: workspaceId,
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

          const saveKey =
            `${workspaceId}:${fileId}`;

          if (saveTimers.has(saveKey)) {
            clearTimeout(
              saveTimers.get(saveKey)
            );
          }
          const timer = setTimeout(
            async () => {
              try {
                await updateFileContent({
                  workspaceId,
                  fileId,
                  content,
                  userId:
                    socket.user.userId,
                });

                console.log(
                  `File saved | Workspace: ${workspaceId} | File: ${fileId} | User: ${socket.user.userId}`
                );
              } catch (error) {
                console.error(
                  "File persistence error:",
                  error
                );

                socket.emit(
                  "file:error",
                  {
                    message:
                      "Failed to save file",
                  }
                );
              } finally {
                saveTimers.delete(
                  saveKey
                );
              }
            },
            700
          );

          saveTimers.set(
            saveKey,
            timer
          );

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

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id} | User: ${socket.user.userId}`
      );
    });
  });

  return io;
};

module.exports = initializeSocket;