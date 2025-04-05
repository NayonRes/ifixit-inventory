var express = require("express");
const {
  getDataWithPagination,

  getById,
  createData,
} = require("../controller/warrantyController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

// note : using update_repair permission because for doing any thing in this route it related with repair update user need update_repair permission
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("update_repair"),
    getDataWithPagination
  );

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("update_repair"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("update_repair"), createData);

module.exports = router;
