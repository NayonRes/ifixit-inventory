var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/expenseController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const branchAccessMiddleware = require("../middleware/branchAccessMiddleware");

var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("expense_list"),
    branchAccessMiddleware,
    getDataWithPagination
  );
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_expense_details"),
    getById
  );
router
  .route("/create")
  .post(
    isAuthenticatedUser,
    authorizeRoles("add_expense"),
    createData
  );
router
  .route("/update/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("update_expense"),
    updateData
  );
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
