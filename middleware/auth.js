// middleware/auth.js (CommonJS)
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.authToken;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
}

module.exports = { requireAuth };
