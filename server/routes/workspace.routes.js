const express = require("express");

const {
  createWorkspaceController,
  getWorkspacesController,
  getRecentWorkspacesController,
  getSharedWorkspacesController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
} = require("../controllers/workspace.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  createWorkspaceController
);

router.get(
  "/",
  getWorkspacesController
);

// IMPORTANT:
// These specific routes must come BEFORE /:workspaceId

router.get(
  "/recent",
  getRecentWorkspacesController
);

router.get(
  "/shared",
  getSharedWorkspacesController
);

router.get(
  "/:workspaceId",
  getWorkspaceController
);

router.patch(
  "/:workspaceId",
  updateWorkspaceController
);

router.delete(
  "/:workspaceId",
  deleteWorkspaceController
);

module.exports = router;