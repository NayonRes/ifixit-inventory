var express = require("express");
const {
    getParentDropdown,
    getDataWithPagination,
    getById,
    createData,
    updateData,
    deleteData,
} = require("../controller/purchaseController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const purchaseModel = require("../db/models/purchaseModel");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use
router
    .route("/create")
    .post(isAuthenticatedUser, authorizeRoles("add_purchase"), createData);
router.route("/dropdownlist").get(isAuthenticatedUser, authorizeRoles("purchase_dropdown_list"), getParentDropdown);

router
    .route("/")
    .get(isAuthenticatedUser, authorizeRoles("purchase_list"), getDataWithPagination);

router
    .route("/:id")
    .get(isAuthenticatedUser, authorizeRoles("view_purchase_details"), getById);
// router
//     .route("/create")
//     .post(isAuthenticatedUser, authorizeRoles("dashboard"), createData);

router
    .route("/update/:id")
    .put(isAuthenticatedUser, authorizeRoles("dashboard"), updateData);
// router
//     .route("/delete/:id")
//     .delete(isAuthenticatedUser, authorizeRoles("dashboard"), deleteData);

module.exports = router;
