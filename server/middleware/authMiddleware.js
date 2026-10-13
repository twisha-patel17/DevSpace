const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
return res.status(401).json({
message: "Authentication required",
});
}

const token = authHeader.split(" ")[1];

if (!token) {
return res.status(401).json({
message: "Authentication required",
});
}

try {
const decoded = jwt.verify(
token,
process.env.JWT_ACCESS_SECRET
);

req.user = decoded;
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
  message: "Invalid or expired access token",
});

}
};

module.exports = authMiddleware;
