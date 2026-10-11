
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// Register a new user
const registerUser = async ({ username, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    authProvider: "local",
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  };
};

// Login with email and password
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.authProvider === "github") {
    throw new Error(
      "This account uses GitHub login. Please continue with GitHub."
    );
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  };
};

// Generate a unique username for GitHub users
const generateUniqueUsername = async (githubUsername) => {
  let baseUsername = githubUsername
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 25);

  if (baseUsername.length < 3) {
    baseUsername = `github_${baseUsername}`;
  }

  let username = baseUsername;
  let counter = 1;

  while (await User.exists({ username })) {
    const suffix = `_${counter}`;

    username =
      baseUsername.slice(0, 30 - suffix.length) + suffix;

    counter++;
  }

  return username;
};

// Exchange GitHub OAuth code for a GitHub access token
const getGithubAccessToken = async (code) => {
  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("GitHub token error:", data);
    throw new Error("Failed to authenticate with GitHub");
  }

  return data.access_token;
};

// Fetch the authenticated GitHub user's profile
const getGithubProfile = async (accessToken) => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GitHub profile error:", data);
    throw new Error("Failed to fetch GitHub profile");
  }

  return data;
};

// Fetch the user's verified GitHub email
const getGithubEmail = async (accessToken) => {
  const response = await fetch(
    "https://api.github.com/user/emails",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const emails = await response.json();

  if (!response.ok || !Array.isArray(emails)) {
    throw new Error("Failed to fetch GitHub email");
  }

  const primaryEmail =
    emails.find(
      (email) => email.primary && email.verified
    ) || emails.find((email) => email.verified);

  if (!primaryEmail) {
    throw new Error(
      "No verified email address found on your GitHub account"
    );
  }

  return primaryEmail.email.toLowerCase();
};

// Login or register using GitHub
const loginWithGithub = async (code) => {
  const githubAccessToken = await getGithubAccessToken(code);

  const githubProfile = await getGithubProfile(
    githubAccessToken
  );

  const email = await getGithubEmail(githubAccessToken);

  let user = await User.findOne({
    githubId: String(githubProfile.id),
  });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      throw new Error(
        "An account with this email already exists. Please sign in with your password."
      );
    }

    const username = await generateUniqueUsername(
      githubProfile.login
    );

    user = await User.create({
      username,
      email,
      authProvider: "github",
      githubId: String(githubProfile.id),
      avatar: githubProfile.avatar_url || null,
    });
  } else {
    user.avatar = githubProfile.avatar_url || user.avatar;
    await user.save();
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
  };
};

// Refresh an expired access token using a valid refresh token
const refreshAccessToken = (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    // Verify using JWT_REFRESH_SECRET through the shared helper
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || !decoded.userId) {
      throw new Error("Invalid refresh token payload");
    }

    return generateAccessToken(decoded.userId);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginWithGithub,
  refreshAccessToken,
};