const repairModel = require("../db/models/repairModel");
const repairStatusHistoryModel = require("../db/models/repairStatusHistoryModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const customerModel = require("../db/models/customerModel");
const formatDate = require("../utils/formatDate");
const repairServiceHistoryModel = require("../db/models/repairServiceHistoryModel");
const repairProductHistoryModel = require("../db/models/repairProductHistoryModel");
const transactionHistoryModel = require("../db/models/transactionHistoryModel");
const { createTransaction } = require("./transactionHistoryController");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query================", req.query);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};
  let customerId = "";

  if (req.query.customerNo?.trim()) {
    const customerData = await customerModel.find({
      mobile: new RegExp(`^${req.query.customerNo}$`, "i"),
    });
    console.log("Customer data:", customerData);

    if (customerData?.length > 0) {
      customerId = customerData[0]?._id;
    } else {
      // return res.status(404).json({
      //   success: false,
      //   message: "Customer not found with this mobile number.",
      // });

      return res.status(200).json({
        success: true,
        message: "successful",
        data: [],
        totalData: 0,
        pageNo: page,
        limit: limit,
      });
    }
  }

  console.log("executint this ***********************");

  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.serial) {
    query.serial = new RegExp(`^${req.query.serial}$`, "i");
  }
  if (req.query.repair_status) {
    query.repair_status = {
      $regex: `^${req.query.repair_status}$`,
      $options: "i",
    };
  }
  if (req.query.payment_status) {
    query.payment_status = {
      $regex: `^${req.query.payment_status}$`,
      $options: "i",
    };
  }
  if (req.query.repair_id) {
    query.repair_id = {
      $regex: `^${req.query.repair_id}$`,
      $options: "i",
    };
  }
  if (req.query.model_id) {
    query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  }

  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.customer_id) {
    query.customer_id = new mongoose.Types.ObjectId(req.query.customer_id);
  }
  if (customerId) {
    query.customer_id = new mongoose.Types.ObjectId(customerId);
  }

  // if (req.query.customer_id) {
  //   query.customer_id = new mongoose.Types.ObjectId(req.query.customer_id);
  // }
  // it is originally  device_id. For repair module device under primary device list is product brand list
  if (req.query.brand_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
  }
  if (req.query.created_by) {
    query.created_by = req.query.created_by;
  }

  console.log("startDate", startDate);
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

  let totalData = await repairModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await repairModel.find(query).skip(startIndex).limit(limit);

  const data = await repairModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "repair_by",
        foreignField: "_id",
        as: "repair_by_data",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "created_by",
        foreignField: "email",
        as: "created_by_info",
      },
    },

    {
      $lookup: {
        from: "device_brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
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
      $lookup: {
        from: "branches",
        localField: "branch_id",
        foreignField: "_id",
        as: "branch_data",
      },
    },

    {
      $lookup: {
        from: "repair_status_histories",
        localField: "_id",
        foreignField: "repair_id",
        as: "repair_status_history_data",
      },
    },
    // Lookup users for user_id inside repair_status_history_data
    {
      $lookup: {
        from: "users",
        localField: "repair_status_history_data.user_id",
        foreignField: "_id",
        as: "repair_status_users",
      },
    },
    // Merge repair_status_users into repair_status_history_data
    {
      $addFields: {
        repair_status_history_data: {
          $map: {
            input: "$repair_status_history_data",
            as: "history",
            in: {
              $mergeObjects: [
                "$$history",
                {
                  user_data: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$repair_status_users",
                          as: "user",
                          cond: { $eq: ["$$user._id", "$$history.user_id"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        serial: 1,
        pass_code: 1,
        customer_id: 1,
        brand_id: 1,
        branch_id: 1,
        due_amount: 1,
        discount_amount: 1,
        repair_id: 1,
        repair_by: 1,
        repair_status: 1,
        issues: 1,
        product_details: 1,
        delivery_status: 1,
        repair_checklist: 1,
        payment_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        customer_data: 1,

        "brand_data.name": 1,
        "brand_data._id": 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
        "model_data.name": 1,
        "model_data.device_id": 1,
        "model_data._id": 1,
        "repair_by_data.name": 1,
        "repair_by_data._id": 1,
        "repair_status_history_data._id": 1,
        "repair_status_history_data.remarks": 1,
        "repair_status_history_data.created_by": 1,
        "repair_status_history_data.updated_at": 1,
        "repair_status_history_data.updated_by": 1,
        "repair_status_history_data.user_id": 1,
        "repair_status_history_data.repair_id": 1,
         "repair_status_history_data.warranty_id": 1,
        "repair_status_history_data.repair_status_name": 1,
        "repair_status_history_data.remarks": 1,
        "repair_status_history_data.created_at": 1,
        "repair_status_history_data.user_data._id": 1,
        "repair_status_history_data.user_data.name": 1,
        "repair_status_history_data.user_data.designation": 1,
        "created_by_info._id": 1,
        "created_by_info.name": 1,
        "created_by_info.email": 1,
      },
    },
    {
      $sort: { created_at: -1 },
    },
    {
      $skip: startIndex,
    },
    {
      $limit: limit,
    },
  ]);

  console.log("data", data);
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
    totalData: totalData,
    pageNo: page,
    limit: limit,
  });
});

const getById = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;

  const data = await repairModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "repair_by",
        foreignField: "_id",
        as: "repair_by_data",
      },
    },
    {
      $lookup: {
        from: "repair_status_histories",
        localField: "_id",
        foreignField: "repair_id",
        as: "repair_status_history_data",
      },
    },
    {
      $lookup: {
        from: "warranties",
        localField: "_id",
        foreignField: "repair_id",
        as: "warranties_data",
      },
    },
    {
      $lookup: {
        from: "transaction_histories",
        localField: "transaction_source_id",
        foreignField: "repair_id",
        as: "transaction_histories_data",
        pipeline: [
          // Join created_by user
          {
            $lookup: {
              from: "users",
              let: { createdEmail: "$created_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$createdEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "created_user",
            },
          },
          {
            $unwind: {
              path: "$created_user",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join updated_by user
          {
            $lookup: {
              from: "users",
              let: { updatedEmail: "$updated_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$updatedEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "updated_user",
            },
          },
          {
            $unwind: {
              path: "$updated_user",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "repair_service_histories",
        localField: "_id",
        foreignField: "repair_id",
        as: "repair_service_history_data",
        pipeline: [
          // Join created_by user
          {
            $lookup: {
              from: "users",
              let: { createdEmail: "$created_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$createdEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "created_user",
            },
          },
          {
            $unwind: {
              path: "$created_user",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join updated_by user
          {
            $lookup: {
              from: "users",
              let: { updatedEmail: "$updated_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$updatedEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "updated_user",
            },
          },
          {
            $unwind: {
              path: "$updated_user",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "repair_product_histories",
        localField: "_id",
        foreignField: "repair_id",
        as: "repair_product_history_data",
        pipeline: [
          // Join created_by user
          {
            $lookup: {
              from: "users",
              let: { createdEmail: "$created_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$createdEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "created_user",
            },
          },
          {
            $unwind: {
              path: "$created_user",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join updated_by user
          {
            $lookup: {
              from: "users",
              let: { updatedEmail: "$updated_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$updatedEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "updated_user",
            },
          },
          {
            $unwind: {
              path: "$updated_user",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "repair_attached_spareparts",
        localField: "_id",
        foreignField: "repair_id",
        as: "repair_attached_spareparts_data",
        pipeline: [
          // Join created_by user
          {
            $lookup: {
              from: "users",
              let: { createdEmail: "$created_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$createdEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "created_user",
            },
          },
          {
            $unwind: {
              path: "$created_user",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join updated_by user
          {
            $lookup: {
              from: "users",
              let: { updatedEmail: "$updated_by" },
              pipeline: [
                { $match: { $expr: { $eq: ["$email", "$$updatedEmail"] } } },
                { $project: { _id: 1, name: 1, email: 1 } },
              ],
              as: "updated_user",
            },
          },
          {
            $unwind: {
              path: "$updated_user",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join stocks using sku_number
          {
            $lookup: {
              from: "stocks",
              localField: "sku_number",
              foreignField: "sku_number",
              as: "stocks_data",
              pipeline: [
                // Join products by product_id
                {
                  $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_data",
                  },
                },
                {
                  $unwind: {
                    path: "$product_data",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                // Join product_variations by product_variation_id
                {
                  $lookup: {
                    from: "product_variations",
                    localField: "product_variation_id",
                    foreignField: "_id",
                    as: "product_variation_data",
                  },
                },
                {
                  $unwind: {
                    path: "$product_variation_data",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
            },
          },
          {
            $unwind: { path: "$stocks_data", preserveNullAndEmptyArrays: true },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "device_brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
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
      $lookup: {
        from: "branches",
        localField: "branch_id",
        foreignField: "_id",
        as: "branch_data",
      },
    },
    // Lookup users for user_id inside repair_status_history_data
    {
      $lookup: {
        from: "users",
        localField: "repair_status_history_data.user_id",
        foreignField: "_id",
        as: "repair_status_users",
      },
    },
    // Merge repair_status_users into repair_status_history_data
    {
      $addFields: {
        repair_status_history_data: {
          $map: {
            input: "$repair_status_history_data",
            as: "history",
            in: {
              $mergeObjects: [
                "$$history",
                {
                  user_data: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$repair_status_users",
                          as: "user",
                          cond: { $eq: ["$$user._id", "$$history.user_id"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        serial: 1,
        pass_code: 1,
        customer_id: 1,
        brand_id: 1,
        branch_id: 1,
        due_amount: 1,
        discount_amount: 1,
        repair_id: 1,
        repair_by: 1,
        repair_status: 1,
        issues: 1,
        product_details: 1,
        delivery_status: 1,
        repair_checklist: 1,
        payment_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        customer_data: 1,

        "brand_data.name": 1,
        "brand_data._id": 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
        "model_data.name": 1,
        "model_data.device_id": 1,
        "model_data._id": 1,
        "repair_by_data.name": 1,
        "repair_by_data._id": 1,
        "repair_status_history_data._id": 1,
        "repair_status_history_data.remarks": 1,
        "repair_status_history_data.created_by": 1,
        "repair_status_history_data.updated_at": 1,
        "repair_status_history_data.updated_by": 1,
        "repair_status_history_data.user_id": 1,
        "repair_status_history_data.repair_id": 1,
         "repair_status_history_data.warranty_id": 1,
        "repair_status_history_data.repair_status_name": 1,
        "repair_status_history_data.remarks": 1,
        "repair_status_history_data.created_at": 1,
        "repair_status_history_data.user_data._id": 1,
        "repair_status_history_data.user_data.name": 1,
        "repair_status_history_data.user_data.designation": 1,
        repair_attached_spareparts_data: 1,
        warranties_data: 1,
        repair_product_history_data: 1,
        repair_service_history_data: 1,
        transaction_histories_data: 1,
      },
    },
  ]);

  if (!data || data.length === 0) {
    return next(new ErrorHander("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "success",
    data: data[0],
  });
});

// const createData = catchAsyncError(async (req, res, next) => {
//   console.log("req.files--------", req.files);
//   console.log("req.body------------", req.body);

//   let newIdserial;
//   let newIdNo;
//   let newId;
//   const lastDoc = await repairModel.find().sort({ _id: -1 });

//   if (lastDoc.length > 0) {
//     newIdserial = lastDoc[0].repair_id.slice(0, 2);
//     newIdNo = parseInt(lastDoc[0].repair_id.slice(2)) + 1;
//     newId = newIdserial.concat(newIdNo);
//   } else {
//     newId = "RN10000";
//   }

//   const { token } = req.cookies;
//   let decodedData = jwt.verify(token, process.env.JWT_SECRET);

//   let newData = {
//     ...req.body,
//     repair_id: newId,
//     created_by: decodedData?.user?.email,
//   };
//   const data = await repairModel.create(newData);

//   console.log("data *************************", data._id);
//   console.log("data *************************", data);
//   // creating status histoy
//   let newStatusData = {
//     user_id: new mongoose.Types.ObjectId(req.body?.repair_by),
//     repair_id: new mongoose.Types.ObjectId(data._id),

//     repair_status_name: req.body?.repair_status,
//     created_by: decodedData?.user?.email,
//   };
//   const statusData = await repairStatusHistoryModel.create(newStatusData);
//   // creating issue/service histoy
//   let newServiceData = {
//     repair_id: new mongoose.Types.ObjectId(data._id),

//     service_info: Array.isArray(req.body?.issues)
//       ? req.body.issues.map((issue) => ({
//           ...issue,
//           service_id: new mongoose.Types.ObjectId(issue.service_id),
//         }))
//       : [],

//     created_by: decodedData?.user?.email,
//   };

//   const serviceData = await repairServiceHistoryModel.create(newServiceData);
//   // creating product histoy
//   let newProductData = {
//     repair_id: new mongoose.Types.ObjectId(data._id),

//     product_details: Array.isArray(req.body?.issues)
//       ? req.body.issues.map((product) => ({
//           ...product,
//           product_id: new mongoose.Types.ObjectId(product.product_id),
//           product_variation_id: new mongoose.Types.ObjectId(
//             product.product_variation_id
//           ),
//         }))
//       : [],

//     created_by: decodedData?.user?.email,
//   };

//   const productData = await repairProductHistoryModel.create(newProductData);

//   res.send({
//     message: "success",
//     status: 201,
//     data: data,
//     statusData: statusData,
//     serviceData: serviceData,
//     productData: productData,
//   });
// });

// const updateData = async (req, res, next) => {
//   try {
//     const { token } = req.cookies;
//     let data = await repairModel.findById(req.params.id);

//     if (!data) {
//       console.log("if");
//       return next(new ErrorHander("No data found", 404));
//     }

//     let decodedData = jwt.verify(token, process.env.JWT_SECRET);

//     const newData = {
//       ...req.body,
//       updated_by: decodedData?.user?.email,
//       updated_at: new Date(),
//     };
//     console.log("newData", newData);
//     let updateData = await repairModel.findByIdAndUpdate(
//       req.params.id,
//       newData,
//       {
//         new: true,
//         runValidators: true,
//         useFindAndModified: false,
//       }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Update successfully",
//       data: updateData,
//     });
//   } catch (error) {
//     console.log("error", error);
//     res.send({ message: "error", status: 400, error: error });
//   }
// };

// ======================
// Helper functions
// ======================
async function createStatusHistory(session, req, repairId, decodedData) {
  console.log("req.body.repair_status:", req.body.repair_status);
  const newStatusData = {
    user_id: new mongoose.Types.ObjectId(req.body?.repair_by),
    repair_id: new mongoose.Types.ObjectId(repairId),
    repair_status_name: req.body?.repair_status,
    remarks: req.body?.repair_status_remarks,
    created_by: decodedData?.user?.email,
  };

  const statusData = await repairStatusHistoryModel.create([newStatusData], {
    session,
  });

  console.log("newStatusData", newStatusData);
  console.log("statusData", statusData);

  if (!statusData || statusData.length === 0) {
    return null;
  }
  return statusData[0];
}

async function createServiceHistory(session, req, repairId, decodedData) {
  const newServiceData = {
    repair_id: new mongoose.Types.ObjectId(repairId),
    service_info: Array.isArray(req.body?.issues)
      ? req.body.issues.map((issue) => ({
          ...issue,
          service_id: new mongoose.Types.ObjectId(issue.service_id),
        }))
      : [],
    created_by: decodedData?.user?.email,
  };

  const serviceData = await repairServiceHistoryModel.create([newServiceData], {
    session,
  });
  if (!serviceData || serviceData.length === 0) {
    return null;
  }
  return serviceData[0];
}

async function createProductHistory(session, req, repairId, decodedData) {
  const newProductData = {
    repair_id: new mongoose.Types.ObjectId(repairId),
    product_details: Array.isArray(req.body?.product_details)
      ? req.body.product_details.map((product) => ({
          ...product,
          product_id: new mongoose.Types.ObjectId(product.product_id),
          product_variation_id: new mongoose.Types.ObjectId(
            product.product_variation_id
          ),
        }))
      : [],
    created_by: decodedData?.user?.email,
  };

  const productData = await repairProductHistoryModel.create([newProductData], {
    session,
  });
  if (!productData || productData.length === 0) {
    return null;
  }
  return productData[0];
}

// ======================
// Main function
// ======================
const createData = catchAsyncError(async (req, res, next) => {
  // console.log("req.body.product_details:", req.body.product_details);

  // Step 0: Generate new repair_id
  const lastDoc = await repairModel.find().sort({ _id: -1 });
  let newId;
  if (lastDoc.length > 0) {
    const serial = lastDoc[0].repair_id.slice(0, 2);
    const number = parseInt(lastDoc[0].repair_id.slice(2)) + 1;
    newId = serial.concat(number);
  } else {
    newId = "RN10000";
  }

  // Step 1: Decode JWT
  const { token } = req.cookies;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  // Step 2: Start session
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 2a: Create repair
      const newRepairData = {
        ...req.body,
        repair_id: newId,
        created_by: decodedData?.user?.email,
      };
      const data = await repairModel.create([newRepairData], { session });
      const repair = data[0];
      console.log("repair111", repair);

      if (!repair) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Failed to create repair" });
      }

      // 2b: Create status history
      const statusData = await createStatusHistory(
        session,
        req,
        repair._id,
        decodedData
      );
      if (!statusData) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save status history" });
      }

      // 2c: Create transaction history (only if billCollections exist)

      let transactionData = null;
      if (
        Array.isArray(req.body?.billCollections) &&
        req.body.billCollections.length > 0
      ) {
        transactionData = await createTransaction(
          "Repair Income",
          repair._id, // transaction_source_id
          req.body.billCollections, // transaction_info
          "repair", // transaction_source_type
          "credit", // transaction_type
          decodedData?.user?.email, // created_by
          session // optional
        );

        if (!transactionData) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ message: "Failed to save transaction history" });
        }
      }

      // let transactionData = null;
      // if (
      //   Array.isArray(req.body?.billCollections) &&
      //   req.body.billCollections.length > 0
      // ) {
      //   transactionData = await createTransactionHistory(
      //     session,
      //     req,
      //     repair._id,
      //     decodedData
      //   );
      //   if (!transactionData) {
      //     await session.abortTransaction();
      //     session.endSession();
      //     return res
      //       .status(404)
      //       .json({ message: "Failed to save transaction history" });
      //   }
      // }

      // 2c: Create service history (only if issues exist)
      let serviceData = null;
      // if (Array.isArray(req.body?.issues) && req.body.issues.length > 0) {
      serviceData = await createServiceHistory(
        session,
        req,
        repair._id,
        decodedData
      );
      if (!serviceData) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save service history" });
      }
      // }

      // 2d: Create product history (only if product_details exist)
      let productData = null;
      // if (
      //   Array.isArray(req.body?.product_details) &&
      //   req.body.product_details.length > 0
      // ) {
      productData = await createProductHistory(
        session,
        req,
        repair._id,
        decodedData
      );
      if (!productData || productData.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save product history" });
      }
      // }

      // 2e: Send success response
      return res.status(201).json({
        message: "Success",
        data: repair,
        statusData,
        serviceData,
        productData,
        transactionData,
      });
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    next(error);
  } finally {
    session.endSession();
  }
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  // Step 0: Find existing repair
  const existingRepair = await repairModel.findById(req.params.id);
  if (!existingRepair) {
    return next(new ErrorHander("No data found", 404));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1: Update repair
      const updatedData = {
        ...req.body,
        updated_by: decodedData?.user?.email,
        updated_at: new Date(),
      };

      const updatedRepair = await repairModel.findByIdAndUpdate(
        req.params.id,
        updatedData,
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
          session,
        }
      );

      if (!updatedRepair) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Failed to update repair" });
      }

      // 2: Status history
      const statusData = await createStatusHistory(
        session,
        req,
        updatedRepair._id,
        decodedData
      );
      if (!statusData) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save status history" });
      }
      // 2c: Create transaction history (only if billCollections exist)

      let transactionData = null;

      if (
        Array.isArray(req.body?.billCollections) &&
        req.body.billCollections.length > 0
      ) {
        transactionData = await createTransaction(
          "Repair Income",
          updatedRepair._id, // transaction_source_id
          req.body.billCollections, // transaction_info
          "repair", // transaction_source_type
          "credit", // transaction_type
          decodedData?.user?.email, // created_by
          session // optional, will be used if transaction is active
        );

        if (!transactionData) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ message: "Failed to save transaction history" });
        }
      }
      // let transactionData = null;
      // if (
      //   Array.isArray(req.body?.billCollections) &&
      //   req.body.billCollections.length > 0
      // ) {
      //   transactionData = await createTransactionHistory(
      //     session,
      //     req,
      //     updatedRepair._id,
      //     decodedData
      //   );
      //   if (!transactionData) {
      //     await session.abortTransaction();
      //     session.endSession();
      //     return res
      //       .status(404)
      //       .json({ message: "Failed to save transaction history" });
      //   }
      // }
      // 3: Service history
      let serviceData = null;
      // if (Array.isArray(req.body?.issues) && req.body.issues.length > 0) {
      serviceData = await createServiceHistory(
        session,
        req,
        updatedRepair._id,
        decodedData
      );
      if (!serviceData) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save service history" });
      }
      // }

      // 4: Product history
      let productData = null;
      // if (
      //   Array.isArray(req.body?.product_details) &&
      //   req.body.product_details.length > 0
      // ) {
      productData = await createProductHistory(
        session,
        req,
        updatedRepair._id,
        decodedData
      );
      if (!productData || productData.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Failed to save product history" });
      }
      // }

      // 5: Success response
      return res.status(200).json({
        success: true,
        message: "Update successfully",
        data: updatedRepair,
        statusData,
        serviceData,
        productData,
        transactionData,
      });
    });
  } catch (error) {
    console.log("Transaction failed:", error);
    res.status(400).json({
      success: false,
      message: "Update failed",
      error: error.message || error,
    });
  } finally {
    session.endSession();
  }
});

const deleteData = catchAsyncError(async (req, res, next) => {
  let data = await repairModel.findById(req.params.id);
  console.log("data", data.images);
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }

  await data.remove();
  res.status(200).json({
    success: true,
    message: "Delete successfully",
    data: data,
  });
});

module.exports = {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
