const {
  registerUser,
  loginUser,
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

    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
};