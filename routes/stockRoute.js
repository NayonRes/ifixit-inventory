var express = require("express");
const {
  getDataWithGroupByUpdateDate,
  getDataWithPagination,
  getAllStock,
  getById,
  createData,
  updateData,
  purchaseReturn,
  stockAdjustment,
  deleteData,
  getHistory,
} = require("../controller/stockController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/group-by-list")
  .get(
    isAuthenticatedUser,
    authorizeRoles("stock_list"),
    getDataWithGroupByUpdateDate
  );
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("stock_list"),
    getDataWithPagination
  );
router
  .route("/history")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_stock_details"),
    getHistory
  );
router
  .route("/stock-skus-details")
  .get(isAuthenticatedUser, authorizeRoles("stock_list"), getAllStock);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_stock_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_stock"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_stock"), updateData);
router
  .route("/purchase-return")
  .post(isAuthenticatedUser, authorizeRoles("update_stock"), purchaseReturn);
router
  .route("/stock-adjustment")
  .post(isAuthenticatedUser, authorizeRoles("update_stock"), stockAdjustment);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
