const express = require("express");

const {
  createWorkspaceController,
  getWorkspacesController,
  getRecentWorkspacesController,
  getSharedWorkspacesController,
  markWorkspaceOpenedController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
} = require("../controllers/workspace.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all workspace routes
router.use(authMiddleware);

// Create workspace
router.post(
  "/",
  createWorkspaceController
);

// Get all workspaces
router.get(
  "/",
  getWorkspacesController
);

// Get recent workspaces
router.get(
  "/recent",
  getRecentWorkspacesController
);

// Get shared workspaces
router.get(
  "/shared",
  getSharedWorkspacesController
);

// Mark workspace as opened
router.patch(
  "/:workspaceId/opened",
  markWorkspaceOpenedController
);

// Get single workspace
router.get(
  "/:workspaceId",
  getWorkspaceController
);

// Update workspace
router.patch(
  "/:workspaceId",
  updateWorkspaceController
);

// Delete workspace
router.delete(
  "/:workspaceId",
  deleteWorkspaceController
);

module.exports = router;