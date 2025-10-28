const modelModel = require("../db/models/modelModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const formatDate = require("../utils/formatDate");
const deviceModel = require("../db/models/deviceModel");
// const getModelByDeviceId = catchAsyncError(async (req, res, next) => {
//   var query = {};
//   if (req.query.status) {
//     query.status = req.query.status === "true";
//   }
//   if (req.query.device_id) {
//     query.device_id = new mongoose.Types.ObjectId(req.query.device_id);
//   }

//    // If endpoint is provided, fetch the device ID first
//   if (req.query.endpoint) {
//     const device = await deviceModel.findOne({ endpoint: req.query.endpoint }).select("_id");
//     if (!device) {
//       return res.status(404).send({ message: "Device not found for this endpoint" });
//     }
//     query.device_id = device._id;
//   }
//   let data = await modelModel
//     .find(query)
//     .select("_id name image")
//     .sort({ order_no: -1 });

//   if (!data) {
//     return res.status(404).send({ message: "No data found" });
//   }

//   res.send({ message: "success", status: 200, data: data });
// });
const getModelByDeviceId = catchAsyncError(async (req, res, next) => {
  let query = {};

  // If status is provided
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  // If device_id is provided directly
  if (req.query.device_id) {
    query.device_id = new mongoose.Types.ObjectId(req.query.device_id);
  }

  // If endpoint is provided
  if (req.query.endpoint) {
    const device = await deviceModel
      .findOne({ endpoint: req.query.endpoint })
      .select("_id");
    if (!device) {
      return res
        .status(404)
        .send({ message: "Device not found for this endpoint" });
    }

    // Check if any device has this device as parent
    const childDevices = await deviceModel
      .find({ parent_id: device._id })
      .select("_id name image");
    if (childDevices.length > 0) {
      // Return child devices instead of models
      return res.send({
        message: "success",
        status: 200,
        data: childDevices,
        childDevice: true,
      });
    }

    // No child devices, so use this device ID for model query
    query.device_id = device._id;
  }

  // Fetch models
  const data = await modelModel
    .find(query)
    .select("_id name image")
    .sort({ order_no: -1 });

  if (!data || data.length === 0) {
    return res.status(404).send({ message: "No data found" });
  }

  res.send({ message: "success", status: 200, data, childDevice: false });
});

module.exports = {
  getModelByDeviceId,
};
