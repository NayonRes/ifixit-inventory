var express = require("express");
const {
  getDropdown,
  getById,
  createData,
  updateData,
  getDataWithPagination,
  deleteData,
  loginUser,
  logout,
  updatePassword,
  updateProfile,
} = require("../controller/userController");
var router = express.Router();
const userModel = require("../db/models/userModel");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

//Must be maintain the serial of declaring router.route accordimg to less middleware use

router.route("/login").post(loginUser);
router.route("/update-password").post(isAuthenticatedUser, authorizeRoles("update_user"), updatePassword);
router.route("/update-profile/:id").put(isAuthenticatedUser, authorizeRoles("update_user"), updateProfile);

router.route("/dropdownlist").get(isAuthenticatedUser, authorizeRoles("user_dropdown_list"), getDropdown);
// router.route("/leaf-dropdown").get(getLeafCategoryList);

// router.route("/category-filter-list").post(getCategoryWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("user_list"), getDataWithPagination);

router.route("/logout").get(logout);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_user_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_user"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_user"), updateData);
// router.route("/update/:id").put(isAuthenticatedUser, authorizeRoles("per135"),updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("update_user"), deleteData);

module.exports = router;
