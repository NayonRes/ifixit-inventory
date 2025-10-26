var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
} = require("../controller/questionController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const deviceModel = require("../db/models/deviceModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
// router
//   .route("/create")
//   .post(createData);

router.route("/").get(isAuthenticatedUser, getDataWithPagination);

router.route("/create").post(isAuthenticatedUser, createData);

router.route("/update/:id").put(isAuthenticatedUser, updateData);
router.route("/:id").get(isAuthenticatedUser, getById);

module.exports = router;
