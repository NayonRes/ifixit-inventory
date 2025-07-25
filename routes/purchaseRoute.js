var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/purchaseController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const purchaseModel = require("../db/models/purchaseModel");
const branchAccessMiddleware = require("../middleware/branchAccessMiddleware");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_purchase"), createData);
router
  .route("/dropdownlist")
  .get(
    isAuthenticatedUser, 
    getParentDropdown
  );

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_purchase_details"), getById);
// router
//     .route("/create")
//     .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_purchase"), updateData);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("purchase_list"),
    branchAccessMiddleware,
    getDataWithPagination
  );
// router
//     .route("/delete/:id")
//     .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
