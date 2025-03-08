var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  createLimit,
  updateData,
  getBrnachLimit,
} = require("../controller/stockCounterAndLimitController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();
router.route("/branch-limit").get(isAuthenticatedUser, getBrnachLimit);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("stock_alert_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("stock_alert_list"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_stock_alret"), createData);
router
  .route("/create-limit")
  .post(isAuthenticatedUser, authorizeRoles("add_stock_alret"), createLimit);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("add_stock_alret"), updateData);

// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
