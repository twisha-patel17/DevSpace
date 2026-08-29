const express = require("express");

const {
  createWorkspaceController,
  getWorkspacesController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
} = require("../controllers/workspace.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createWorkspaceController);

router.get("/", getWorkspacesController);

router.get("/:workspaceId", getWorkspaceController);

router.patch(
  "/:workspaceId",
  updateWorkspaceController
);

router.delete(
  "/:workspaceId",
  deleteWorkspaceController
);

module.exports = router;