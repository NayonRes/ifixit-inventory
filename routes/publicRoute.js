var express = require("express");
const { getModelByDeviceId ,getServiceByModelId,getServiceDetails} = require("../controller/publicController");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use

router.route("/model-get-by-device").get(getModelByDeviceId);
router.route("/service-get-by-model").get(getServiceByModelId);
router.route("/service-details/:id").get(getServiceDetails);

module.exports = router;
