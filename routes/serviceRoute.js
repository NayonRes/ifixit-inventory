var express = require("express");
const {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
} = require("../controller/serviceController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

var router = express.Router();
router.route("/public/list").get(getDataWithPagination);
router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("service_list"),
    getDataWithPagination
  );

router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_service"), createData);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_service"), updateData);

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_service_details"), getById);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
