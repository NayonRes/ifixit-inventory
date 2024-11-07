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
router
  .route("/dropdownlist")
  .get(isAuthenticatedUser, authorizeRoles("per139"), getDropdown);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per138"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per138"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("per139"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per140"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per141"), deleteData);

module.exports = router;
