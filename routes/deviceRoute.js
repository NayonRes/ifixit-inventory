var express = require("express");
const {
  getParentDropdown,
  getLeafDeviceList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getDeviceWiseFilterList,
} = require("../controller/deviceController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const deviceModel = require("../db/models/deviceModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router
  .route("/create")
  .post(createData);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);
router.route("/leaf-dropdown").get(isAuthenticatedUser, getLeafDeviceList);
router
  .route("/device-filter-list")
  .post(isAuthenticatedUser, getDeviceWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per103"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per103"), getById);
// router
//   .route("/create")
//   .post(isAuthenticatedUser, authorizeRoles("per104"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per105"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per106"), deleteData);

module.exports = router;
