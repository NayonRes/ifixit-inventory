var express = require("express");
const {
  getDeviceWiseModelDropdown,
  getParentDropdown,
  getLeafModelList,
  getDataWithPagination,
  getById,
  getByDeviceId,
  createData,
  updateData,
  deleteData,
  getModelWiseFilterList,
} = require("../controller/modelController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const modelModel = require("../db/models/modelModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router
  .route("/create")
  .post(isAuthenticatedUser, authorizeRoles("add_model"), createData);
router
  .route("/dropdownlist")
  .get(
    isAuthenticatedUser,
    authorizeRoles("model_dropdown_list"),
    getParentDropdown
  );
router
  .route("/leaf-dropdown")
  .get(
    isAuthenticatedUser,
    authorizeRoles("model_dropdown_list"),
    getLeafModelList
  );
router
  .route("/device-model")
  .get(
    isAuthenticatedUser,
    authorizeRoles("model_dropdown_list"),
    getDeviceWiseModelDropdown
  );
router
  .route("/model-filter-list")
  .post(
    isAuthenticatedUser,
    authorizeRoles("model_dropdown_list"),
    getModelWiseFilterList
  );

router
  .route("/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("model_list"),
    getDataWithPagination
  );
router.route("/public/get-by-device").get(getByDeviceId);
router
  .route("/get-by-device/")
  .get(
    isAuthenticatedUser,
    authorizeRoles("model_dropdown_list"),
    getByDeviceId
  );
router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRoles("view_model_details"), getById);
// router
//   .route("/get-by-device/")
//   .get(isAuthenticatedUser, authorizeRoles("view_model_details"), getByDeviceId);

router
  .route("/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("update_model"), updateData);
// router
//   .route("/delete/:id")
//   .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
