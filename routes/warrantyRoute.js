var express = require("express");
const {
  getDataWithPagination,

  getById,
  createData,
  updateData,
} = require("../controller/warrantyController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const branchAccessMiddleware = require("../middleware/branchAccessMiddleware");

var router = express.Router();

// note : using update_repair permission because for doing any thing in this route it related with repair update user need update_repair permission
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("update_repair"),
    branchAccessMiddleware,
    getDataWithPagination
  );

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("update_repair"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("update_repair"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_repair"), updateData);

module.exports = router;
