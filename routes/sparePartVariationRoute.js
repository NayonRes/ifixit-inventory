var express = require("express");
const {
  lightSearchWithPagination,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/sparePartVariationController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per123"), getDataWithPagination);
router
  .route("/lightSearch")
  .get(isAuthenticatedUser, authorizeRoles("per123"), lightSearchWithPagination);
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
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per126"), deleteData);

module.exports = router;
