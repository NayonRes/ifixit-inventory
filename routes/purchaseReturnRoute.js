var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/purchaseReturnController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("purchase_return_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_purchase_details"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_purchase_return"), createData);
router
  .route("/update/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("update_purchase_return"),
    updateData
  );
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
