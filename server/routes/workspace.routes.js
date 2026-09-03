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

router.get(
  "/recent",
  getRecentWorkspacesController
);

router.get(
  "/shared",
  getSharedWorkspacesController
);

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

router.patch(
  "/:workspaceId/opened",
  markWorkspaceOpenedController
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