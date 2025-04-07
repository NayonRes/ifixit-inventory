var express = require("express");
const {
  getDataWithPagination,
  lightSearchWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("spare_parts_list"),
    getDataWithPagination
  );
// router
//   .route("/lightSearch")
//   .get(isAuthenticatedUser, authorizeRoles("per123"), lightSearchWithPagination);
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_spare_parts_details"),
    getById
  );

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_spare_parts"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_spare_parts"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
