var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/repairStatusHistoryController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const repairStatusHistoryModel = require("../db/models/repairStatusHistoryModel");

var router = express.Router();

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("repair_status_list"),
    getDataWithPagination
  );
router
  .route("/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("view_repair_status_details"),
    getById
  );
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_repair_status"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_repair_status"), updateData);
// router
//     .route("/delete/:id")
//     .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
