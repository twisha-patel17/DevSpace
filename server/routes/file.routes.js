const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createFile,
  getProjectFiles,
  getFile,
  updateFile,
  deleteFile,
} = require("../controllers/file.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createFile);
router.get("/project/:projectId", getProjectFiles);
router.get("/:id", getFile);
router.put("/:id", updateFile);
router.delete("/:id", deleteFile);

module.exports = router;