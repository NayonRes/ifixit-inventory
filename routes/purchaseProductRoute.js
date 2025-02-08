var express = require("express");
const {
  lightSearchWithPagination,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getLastPurchaseItem,
} = require("../controller/purchaseProductController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();
router.route("/last-purchase").get(isAuthenticatedUser, getLastPurchaseItem);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("product_list"),
    getDataWithPagination
  );

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_product_details"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_product"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_product"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
