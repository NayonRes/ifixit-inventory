var express = require("express");
const {
  getDeviceWiseModelDropdown,
  getParentDropdown,
  getLeafModelList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getModelWiseFilterList,
} = require("../controller/modelController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const modelModel = require("../db/models/modelModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router.route("/create").post(createData);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);
router.route("/leaf-dropdown").get(isAuthenticatedUser, getLeafModelList);
router
  .route("/device-model")
  .get(isAuthenticatedUser, getDeviceWiseModelDropdown);
router
  .route("/model-filter-list")
  .post(isAuthenticatedUser, getModelWiseFilterList);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getById);
// router
//   .route("/create")
//   .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("dashboard"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
