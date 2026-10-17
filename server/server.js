const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const connectDB = require("./config/db");
require("./config/redis");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const executionRoutes = require("./routes/execution.routes");
const notificationRoutes = require("./routes/notification.routes");

const notificationService = require("./services/notification.service");

const initializeSocket = require("./sockets/socket");

const app = express();

const server = http.createServer(app);

const io = initializeSocket(server);

notificationService.setSocketIO(io);

app.set("io", io);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "DevSpace server is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`DevSpace server running on port ${PORT}`);
  });
};

startServer();