const jwt = require("jsonwebtoken");

const branchAccessMiddleware = (req, res, next) => {
  try {
    // Extract token from headers
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token not provided" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract branch_id from token payload
    const { branch_id, is_main_branch } = decoded?.user;

    if (!branch_id) {
      return res
        .status(400)
        .json({ message: "Invalid token: Branch ID missing" });
    }

    if (!is_main_branch || is_main_branch === null) {
      req.query.branch_id = branch_id; // Set branch_id in request params
    }
    next(); // Pass control to the next middleware
  } catch (error) {
    console.error("Error in branch access middleware:", error);
    res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};

module.exports = branchAccessMiddleware;
