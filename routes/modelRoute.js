var express = require("express");
const {
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
router
  .route("/create")
  .post(createData);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);
router.route("/leaf-dropdown").get(isAuthenticatedUser, getLeafModelList);
router
  .route("/model-filter-list")
  .post(isAuthenticatedUser, getModelWiseFilterList);

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
