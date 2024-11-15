var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/supplierController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const supplierModel = require("../db/models/supplierModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router.route("/create").post(createData);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);

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
