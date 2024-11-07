var express = require("express");
const {
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/locationController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const locationModel = require("../db/models/locationModel");
var router = express.Router();

//Must be maintain the serial of declaring router.route accordimg to less middleware use
router.route("/dropdownlist").get(getParentDropdown);

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("per108"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("per108"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("per109"), createData);
router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("per110"), updateData);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("per111"), deleteData);

module.exports = router;
