const jwt = require("jsonwebtoken");

const branchAccessMiddleware = (req, res, next) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token not provided" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract branch_id from token payload
    const { branch_id } = decoded;

    if (!branch_id) {
      return res
        .status(400)
        .json({ message: "Invalid token: Branch ID missing" });
    }

    // Check if it's the main branch
    if (branch_id === "main") {
      // Main branch: No restriction
      req.isMainBranch = true; // Add a flag for convenience
    } else {
      // Sub-branch: Restrict to specific branch
      req.params.branch_id = branch_id; // Set branch_id in request params
      req.isMainBranch = false; // Add a flag for convenience
    }

    next(); // Pass control to the next middleware
  } catch (error) {
    console.error("Error in branch access middleware:", error);
    res.status(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};

module.exports = branchAccessMiddleware;
