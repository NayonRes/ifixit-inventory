var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/blogController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("blog_list"), getDataWithPagination);

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_blog_details"), getById);

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_blog"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_blog"), updateData);

// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
