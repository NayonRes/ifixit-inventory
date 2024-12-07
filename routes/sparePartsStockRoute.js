var express = require("express");
const {
  getDataWithPagination,
  getAllStock,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/sparePartsStockController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
  .route("/stock-skus-details")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getAllStock);
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
