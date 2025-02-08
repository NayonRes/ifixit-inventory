var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/transferStockController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("stock_transfer_list"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_stock_transfer_details"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_stock_transfer"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_stock_transfer"), updateData);

// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
