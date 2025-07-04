var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/expenseCategoryController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(
  isAuthenticatedUser,

  getParentDropdown
);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("expense_category_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_expense_category_details"),
    getById
  );
router
  .route("/create")
  .post(
    isAuthenticatedUser,
    authorizeRoles("add_expense_category"),
    createData
  );
router
  .route("/update/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("update_expense_category"),
    updateData
  );
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
