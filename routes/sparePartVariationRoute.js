var express = require("express");
const {
  lightSearchWithPagination,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  allBranchStock,
} = require("../controller/sparePartVariationController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
  .route("/branch-stock")
  .get(
    isAuthenticatedUser,
    authorizeRoles("dashboard"),
    allBranchStock
  );
router
  .route("/lightSearch")
  .get(
    isAuthenticatedUser,
    authorizeRoles("dashboard"),
    lightSearchWithPagination
  );
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
