
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    // Support common user-ID property names in the JWT payload.
    const userId = decoded.id || decoded.userId || decoded._id;

    if (!userId) {
      console.error(
        "JWT payload does not contain a recognized user ID."
      );

      return res.status(401).json({
        success: false,
        message: "Invalid access token: user ID is missing.",
      });
    }

    // Keep the decoded payload available while standardizing the ID.
    req.user = {
      ...decoded,
      id: userId,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("Access token expired");
    } else if (error.name === "JsonWebTokenError") {
      console.warn("Invalid access token");
    } else {
      console.error("JWT verification failed:", error.message);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

module.exports = authMiddleware;

