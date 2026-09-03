const express = require("express");

const {
  runCodeController,
} = require("../controllers/execution.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/run", runCodeController);

module.exports = router;