var express = require("express");
const {
  geDropdown,
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
router.route("/update-password").post(updatePassword);
router.route("/update-profile/:id").put(updateProfile);

router.route("/dropdownlist").get(geDropdown);
// router.route("/leaf-dropdown").get(getLeafCategoryList);

// router.route("/category-filter-list").post(getCategoryWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);

router.route("/logout").get(logout);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("dashboard"), updateData);
// router.route("/update/:id").put(isAuthenticatedUser, authorizeRoles("per135"),updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
