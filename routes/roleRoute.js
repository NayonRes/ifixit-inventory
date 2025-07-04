var express = require("express");
const {
  getDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/roleController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();
//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(isAuthenticatedUser, getDropdown);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("role_list"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_role_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_role"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_role"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
