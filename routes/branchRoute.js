var express = require("express");
const {
  getParentDropdown,
  getLeafBranchList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getBranchWiseFilterList,
} = require("../controller/branchController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const branchModel = require("../db/models/branchModel");

var router = express.Router();

router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);
router.route("/leaf-dropdown").get(
  isAuthenticatedUser,

  getLeafBranchList
);
router.route("/branch-filter-list").post(
  isAuthenticatedUser,

  getBranchWiseFilterList
);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_branch"), createData);
router.route("/public/list").get(getDataWithPagination);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("branch_list"),
    getDataWithPagination
  );

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_branch"), updateData);
router.route("/public/:id").get(getById);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_branch_details"), getById);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
