var express = require("express");
const {
  lightSearchWithPagination,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  allBranchStock,
  branchStock,
} = require("../controller/sparePartVariationController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("spare_parts_list"),
    getDataWithPagination
  );
router
  .route("/all-branch-stock")
  .get(isAuthenticatedUser, authorizeRoles("all_branch_stock_list"), allBranchStock);
router
  .route("/branch-stock")
  .get(isAuthenticatedUser, authorizeRoles("branch_stock_list"), branchStock);
// router
//   .route("/lightSearch")
//   .get(
//     isAuthenticatedUser,
//     authorizeRoles("dashboard"),
//     lightSearchWithPagination
//   );
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_spare_parts_details"),
    getById
  );

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_spare_parts"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_spare_parts"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
