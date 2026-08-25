const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async ({ username, email, password }) => {
  
  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    throw new Error("Username already exists");
  }
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
};

const loginUser = async ({ email, password }) => {
 
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
};

module.exports = {
  registerUser,
  loginUser,
};