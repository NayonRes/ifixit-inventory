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
router.route("/dropdownlist").get(getParentDropdown);
router.route("/leaf-dropdown").get(getLeafPermissionList);
// router.route("/category-filter-list").post(getCategoryWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per143"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per143"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("per144"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per145"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per146"), deleteData);

module.exports = router;
