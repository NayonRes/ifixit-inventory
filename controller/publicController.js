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
const serviceModel = require("../db/models/serviceModel");
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
      .select("_id name image endpoint order_no");
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
    .select("_id name image endpoint order_no")
    .sort({ order_no: -1 });

  if (!data || data.length === 0) {
    return res.status(404).send({ message: "No data found" });
  }

  res.send({ message: "success", status: 200, data, childDevice: false });
});

const getServiceByModelId = catchAsyncError(async (req, res, next) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = {};

  // if (req.query.model_id) {
  //   query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  // }
  if (req.query.title) {
    query.title = new RegExp(`^${req.query.title}$`, "i");
  }
  if (req.query.endpoint) {
    query.endpoint = new RegExp(`^${req.query.endpoint}$`, "i");
  }
  // If endpoint is provided
  if (req.query.endpoint) {
    const model = await modelModel
      .findOne({ endpoint: req.query.endpoint })
      .select("_id");

    if (!model) {
      return res
        .status(404)
        .send({ message: "Model not found for this endpoint" });
    }

    query.model_id = { $in: [new mongoose.Types.ObjectId(model._id)] };
  }
  if (req.query.model_id) {
    query.model_id = {
      $in: [new mongoose.Types.ObjectId(req.query.model_id)],
    };
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.device_id) {
    query.device_id = new mongoose.Types.ObjectId(req.query.device_id);
  }
  if (req.query.brand_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
  }
  if (req.query.branch_id) {
    query.branch_id = {
      $in: [new mongoose.Types.ObjectId(req.query.branch_id)],
    };
  }
  if (req.query.order_no && !isNaN(req.query.order_no)) {
    query.order_no = parseInt(req.query.order_no);
  }

  if (startDate && endDate) {
    query.created_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    query.created_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    query.created_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  const totalData = await serviceModel.countDocuments(query);

  const data = await serviceModel.aggregate([
    { $match: query },

    // Lookups
    {
      $lookup: {
        from: "devices",
        localField: "device_id",
        foreignField: "_id",
        as: "device_data",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "branch_id",
        foreignField: "_id",
        as: "branch_data",
      },
    },
    {
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },

    // Handle repair_info
    {
      $unwind: {
        path: "$repair_info",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "repair_info.product_id",
        foreignField: "_id",
        as: "repair_info.product_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "repair_info.product_variation_id",
        foreignField: "_id",
        as: "repair_info.product_variation_data",
      },
    },
    {
      $unwind: {
        path: "$repair_info.product_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$repair_info.product_variation_data",
        preserveNullAndEmptyArrays: true,
      },
    },

    // Sort
    {
      $sort: { created_at: 1 },
    },

    // Group back to array
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        repair_info: { $push: "$repair_info" },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$doc", { repair_info: "$repair_info" }],
        },
      },
    },

    // Final Projection
    // {
    //   $project: {
    //     _id: 1,
    //     title: 1,
    //     image: 1,
    //     device_id: 1,
    //     model_id: 1,
    //     branch_id: 1,
    //     brand_id: 1,
    //     order_no: 1,
    //     description: 1,
    //     repair_by: 1,
    //     steps: 1,
    //     repair_info: 1,
    //     remarks: 1,
    //     status: 1,
    //     created_by: 1,
    //     created_at: 1,
    //     updated_by: 1,
    //     updated_at: 1,
    //     "device_data.name": 1,
    //     "device_data.image": 1,
    //     "model_data.name": 1,
    //     "model_data.image": 1,
    //     "brand_data.name": 1,
    //     "branch_data.name": 1,
    //     "branch_data._id": 1,
    //     "branch_data.is_main_branch": 1,
    //     "branch_data.address": 1,
    //     "repair_info.product_data": 1,
    //     "repair_info.product_variation_data": 1,
    //   },
    // },
    {
      $project: {
        _id: 1,
        title: 1,
        image: 1,
        device_id: 1,
        model_id: 1,
        branch_id: 1,
        brand_id: 1,
        order_no: 1,
        endpoints: 1,
        description: 1,
        repair_by: 1,
        steps: 1,
        repair_info: 1, // include all of repair_info
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "device_data.name": 1,
        "device_data.image": 1,
        "model_data.name": 1,
        "model_data.image": 1,
        "brand_data.name": 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
        "branch_data.is_main_branch": 1,
        "branch_data.address": 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
    totalData: totalData,
    modelId: query.model_id,
  });
});
const getServiceDetails = catchAsyncError(async (req, res, next) => {
  
  const id = req.params.id;
  const data = await serviceModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "devices",
        localField: "device_id",
        foreignField: "_id",
        as: "device_data",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "branch_id",
        foreignField: "_id",
        as: "branch_data",
      },
    },
    {
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },
    {
      $unwind: {
        path: "$repair_info",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "repair_info.product_id",
        foreignField: "_id",
        as: "repair_info.product_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "repair_info.product_variation_id",
        foreignField: "_id",
        as: "repair_info.product_variation_data",
      },
    },
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        repair_info: {
          $push: {
            name: "$repair_info.name",
            repair_image: "$repair_info.repair_image",
            details: "$repair_info.details",
            repair_cost: "$repair_info.repair_cost",
            guaranty: "$repair_info.guaranty",
            warranty: "$repair_info.warranty",
            product_id: "$repair_info.product_id",
            product_variation_id: "$repair_info.product_variation_id",
            product_data: { $arrayElemAt: ["$repair_info.product_data", 0] },
            product_variation_data: {
              $arrayElemAt: ["$repair_info.product_variation_data", 0],
            },
          },
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$doc", { repair_info: "$repair_info" }],
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        image: 1,
        device_id: 1,
        model_id: 1,
        branch_id: 1,
        brand_id: 1,
        order_no: 1,
        endpoints: 1,
        description: 1,
        repair_by: 1,
        steps: 1,
        repair_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "device_data.name": 1,
        "device_data.image": 1,
        "model_data.name": 1,
        "model_data.image": 1,
        "brand_data.name": 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
        "branch_data.is_main_branch": 1,
        "branch_data.address": 1,
      },
    },
  ]);

  if (!data || data.length === 0) {
    return res.send({ message: "No data found", status: 404 });
  }

  res.send({ message: "success", status: 200, data: data });
});
module.exports = {
  getModelByDeviceId,
  getServiceByModelId,
  getServiceDetails,
};
