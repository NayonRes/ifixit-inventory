var express = require("express");
const {
  getParentDropdown,
  getLeafPermissionList,
  // getCategoryWiseFilterList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/permissionController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();
//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);
router.route("/leaf-dropdown").get(
  isAuthenticatedUser,

  getLeafPermissionList
);
// router.route("/category-filter-list").post(getCategoryWiseFilterList);

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("permission_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_permission_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_permission"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_permission"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
