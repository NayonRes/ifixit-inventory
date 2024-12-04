var express = require("express");
const {
  getDataWithPagination,
  getById,
  insertLimit,
  //createData,
  //updateData,
  deleteData,
} = require("../controller/stockCounterController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getDataWithPagination);
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("dashboard"), getById);
  
router
  .route("/createData")
  .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);

// router
//   .route("/update/:id")
//   .put(isAuthenticatedUser, authorizeRoles("dashboard"), updateData);

router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
