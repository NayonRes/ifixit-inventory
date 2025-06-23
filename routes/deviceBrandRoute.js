var express = require("express");
const {
  getParentDropdown,
  getLeafDeviceList,
  getDataWithPagination,
  getById,
  getByParent,
  createData,
  updateData,
  deleteData,
  getDeviceWiseFilterList,
  getListGroupByParent,
} = require("../controller/deviceBrandController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const deviceModel = require("../db/models/deviceModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
// router
//   .route("/create")
//   .post(createData);
router.route("/parent-child-list").get(
  isAuthenticatedUser,

  getListGroupByParent
);
router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);
router.route("/leaf-dropdown").get(
  isAuthenticatedUser,

  getLeafDeviceList
);
router.route("/device-filter-list").post(
  isAuthenticatedUser,

  getDeviceWiseFilterList
);

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_brand_list"),
    getDataWithPagination
  );

router.route("/get-by-parent").get(
  isAuthenticatedUser,

  getByParent
);
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_device_brand_details"),
    getById
  );

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_device_brand"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_device_brand"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
