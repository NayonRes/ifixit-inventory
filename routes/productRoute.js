var express = require("express");
const {
  getAll,
  getDataByProductIds,
  getDataWithPagination,
  getById,
  getFilterItems,
  createData,
  updateData,
  patchData,
  deleteData,
} = require("../controller/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const productModel = require("../db/models/productModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/product-list-by-ids").post(getDataByProductIds);
// router.route("/:filters").get(getFilterItems);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per123"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per123"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("per124"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per125"), updateData);
router
  .route("/patch/:id")
  .patch(isAuthenticatedUser, authorizeRoles("per125"), patchData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per126"), deleteData);

module.exports = router;
