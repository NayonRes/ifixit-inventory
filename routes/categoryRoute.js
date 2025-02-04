var express = require("express");
const {
  getParentDropdown,
  getLeafCategoryList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getCategoryWiseFilterList,
} = require("../controller/categoryController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const categoryModel = require("../db/models/categoryModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(isAuthenticatedUser, authorizeRoles("category_dropdown_list"), getParentDropdown);
router.route("/leaf-dropdown").get(isAuthenticatedUser, authorizeRoles("category_dropdown_list"), getLeafCategoryList);
router
  .route("/category-filter-list")
  .post(isAuthenticatedUser, authorizeRoles("category_dropdown_list"), getCategoryWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("category_list"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_category_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_category"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_category"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
