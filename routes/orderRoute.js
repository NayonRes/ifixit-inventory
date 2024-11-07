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
  cancelProduct,
} = require("../controller/orderController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const orderModel = require("../db/models/orderModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use

router.route("/category-filter-list").post(getCategoryWiseFilterList);
router.route("/cancel-product").post(cancelProduct);
router.route("/dropdownlist").get(getParentDropdown);
router.route("/leaf-dropdown").get(getLeafCategoryList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per128"), getDataWithPagination);

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per128"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("per129"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per130"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per131"), deleteData);

module.exports = router;
