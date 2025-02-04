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
router.route("/dropdownlist").get(isAuthenticatedUser, authorizeRoles("customer_dropdown_list"), getParentDropdown);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("customer_list"), getDataWithPagination);
router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("customer_list"), searchCustomer);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_customer_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_customer"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_customer"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
