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
  getByDeviceBrand
} = require("../controller/deviceController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const deviceModel = require("../db/models/deviceModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
// router
//   .route("/create")
//   .post(createData);
router
  .route("/parent-child-list")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getListGroupByParent
  );
router
  .route("/dropdownlist")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getParentDropdown
  );
router
  .route("/dropdownlist")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getByDeviceBrand
  );
router
  .route("/leaf-dropdown")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getLeafDeviceList
  );
router
  .route("/device-filter-list")
  .post(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getDeviceWiseFilterList
  );

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_list"),
    getDataWithPagination
  );
 
router
  .route("/get-by-parent")
  .get(
    isAuthenticatedUser,
    authorizeRoles("device_dropdown_list"),
    getByParent
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_device_details"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_device"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_device"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
