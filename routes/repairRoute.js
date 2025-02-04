var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/repairController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const repairModel = require("../db/models/repairModel");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("repair_list"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_repair_details"), getById);
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_repair"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_repair"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
