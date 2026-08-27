const express = require("express");

const router = express.Router();

const {
  register,
  login,
  githubLogin,
  githubCallback,
} = require("../controllers/auth.controller");

const validate = require("../middleware/validate");

const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validator");

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/github",
  githubLogin
);

router.get(
  "/github/callback",
  githubCallback
);

module.exports = router;