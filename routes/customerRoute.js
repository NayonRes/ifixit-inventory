var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  searchCustomer,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/customerController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const customerModel = require("../db/models/customerModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
// router
//   .route("/create")
//   .post(createData);
router.route("/dropdownlist").get(isAuthenticatedUser, getParentDropdown);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), searchCustomer);
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
