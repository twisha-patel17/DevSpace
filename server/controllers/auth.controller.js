const {
  registerUser,
  loginUser,
  loginWithGithub,
} = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await registerUser({
      username,
      email,
      password,
    });

    res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.message === "User already exists") {
      return res.status(409).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser({
      email,
      password,
    });

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (
      error.message === "Invalid email or password" ||
      error.message ===
        "This account uses GitHub login. Please continue with GitHub."
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const githubLogin = (req, res) => {
  const githubAuthUrl = new URL(
    "https://github.com/login/oauth/authorize"
  );

  githubAuthUrl.searchParams.set(
    "client_id",
    process.env.GITHUB_CLIENT_ID
  );

  githubAuthUrl.searchParams.set(
    "redirect_uri",
    process.env.GITHUB_CALLBACK_URL
  );

  githubAuthUrl.searchParams.set(
    "scope",
    "read:user user:email"
  );

  res.redirect(githubAuthUrl.toString());
};
const githubCallback = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error("GitHub OAuth error:", error);

      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=github_denied`
      );
    }

    if (!code) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=github_failed`
      );
    }

    const result = await loginWithGithub(code);

    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: JSON.stringify(result.user),
    });

    res.redirect(
      `${process.env.CLIENT_URL}/oauth/callback?${params.toString()}`
    );
  } catch (error) {
    console.error("GitHub callback error:", error);

    if (
      error.message ===
      "An account with this email already exists. Please sign in with your password."
    ) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=account_exists`
      );
    }

    if (
      error.message ===
      "No verified email address found on your GitHub account"
    ) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=no_verified_email`
      );
    }

    return res.redirect(
      `${process.env.CLIENT_URL}/login?error=github_failed`
    );
  }
};

module.exports = {
  register,
  login,
  githubLogin,
  githubCallback,
};