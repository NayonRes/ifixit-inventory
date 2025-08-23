var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/issueController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const issueModel = require("../db/models/issueModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("issue_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_issue_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_issue"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_issue"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
