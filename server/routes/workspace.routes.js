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
  getWorkspaceFilesController,
  createWorkspaceFileController,
  updateWorkspaceFileController,
  deleteWorkspaceFileController,
  addWorkspaceMemberController,
  updateWorkspaceMemberRoleController,
  removeWorkspaceMemberController,
} = require("../controllers/workspace.controller");

const {
  searchWorkspaceMembers,
} = require("../controllers/workspaceMemberSearch.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All workspace routes require authentication.
router.use(authMiddleware);

// Workspace CRUD
router.post("/", createWorkspaceController);

router.get("/", getWorkspacesController);

router.get("/recent", getRecentWorkspacesController);

router.get("/shared", getSharedWorkspacesController);

// Workspace file and folder operations
router.get(
  "/:workspaceId/files",
  getWorkspaceFilesController
);

router.post(
  "/:workspaceId/files",
  createWorkspaceFileController
);

router.patch(
  "/:workspaceId/files/:fileId",
  updateWorkspaceFileController
);

router.delete(
  "/:workspaceId/files/:fileId",
  deleteWorkspaceFileController
);

// Workspace activity
router.patch(
  "/:workspaceId/opened",
  markWorkspaceOpenedController
);

// Workspace member search
router.get(
  "/:workspaceId/members/search",
  searchWorkspaceMembers
);

// Individual workspace
router.get(
  "/:workspaceId",
  getWorkspaceController
);

// Workspace-specific settings
router.patch(
  "/:workspaceId",
  updateWorkspaceController
);

// Delete workspace
router.delete(
  "/:workspaceId",
  deleteWorkspaceController
);

// Workspace member management
router.post(
  "/:workspaceId/members",
  addWorkspaceMemberController
);

router.patch(
  "/:workspaceId/members/:memberUserId",
  updateWorkspaceMemberRoleController
);

router.delete(
  "/:workspaceId/members/:memberUserId",
  removeWorkspaceMemberController
);

module.exports = router;
