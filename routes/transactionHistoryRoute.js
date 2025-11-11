var express = require("express");
const {
  getAllData,
  getParentDropdown,
  getLeafCategoryList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getCategoryWiseFilterList,
  updateCollectionStatus
} = require("../controller/transactionHistoryController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const categoryModel = require("../db/models/categoryModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);
router.route("/leaf-dropdown").get(
  isAuthenticatedUser,

  getLeafCategoryList
);
router.route("/category-filter-list").post(
  isAuthenticatedUser,

  getCategoryWiseFilterList
);

router.route("/").get(
  isAuthenticatedUser,

  getDataWithPagination
);
router.route("/all").get(
  isAuthenticatedUser,
  getAllData
);
router.route("/:id").get(isAuthenticatedUser, getById);
router.route("/create").post(isAuthenticatedUser, createData);
router.route("/update-transaction-received-status").put(isAuthenticatedUser, updateCollectionStatus);
router.route("/update/:id").put(isAuthenticatedUser, updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
