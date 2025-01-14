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
  .get(isAuthenticatedUser, getListGroupByParent);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);
router.route("/leaf-dropdown").get(isAuthenticatedUser, getLeafDeviceList);
router
  .route("/device-filter-list")
  .post(isAuthenticatedUser, getDeviceWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
    .route("/get-by-parent")
    .get(isAuthenticatedUser, authorizeRoles("dashboard"), getByParent);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("dashboard"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
