var express = require("express");
const { getModelByDeviceId } = require("../controller/publicController");

var router = express.Router();

//Must be maintain the serial of declaring router.route according to less middleware use

router.route("/model-get-by-device").get(getModelByDeviceId);

module.exports = router;
