var express = require("express");
const {
  getParentDropdown,
  getLeafBrandList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getBrandWiseFilterList,
} = require("../controller/brandController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const brandModel = require("../db/models/brandModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_brand"), createData);
router
  .route("/dropdownlist")
  .get(
    isAuthenticatedUser,
    authorizeRoles("brand_dropdown_list"),
    getParentDropdown
  );
router
  .route("/leaf-dropdown")
  .get(
    isAuthenticatedUser,
    authorizeRoles("brand_dropdown_list"),
    getLeafBrandList
  );
router
  .route("/brand-filter-list")
  .post(
    isAuthenticatedUser,
    authorizeRoles("brand_dropdown_list"),
    getBrandWiseFilterList
  );

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("brand_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_brand_details"), getById);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_brand"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
