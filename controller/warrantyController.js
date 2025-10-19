const warrantyModel = require("../db/models/warrantyModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const formatDate = require("../utils/formatDate");
const repairStatusHistoryModel = require("../db/models/repairStatusHistoryModel");
const { createTransaction } = require("./transactionHistoryController");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 1000;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};

  if (req.query.repair_id) {
    query.repair_id = new mongoose.Types.ObjectId(req.query.repair_id);
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.warranty_id) {
    query.warranty_id = {
      $regex: `^${req.query.warranty_id}$`,
      $options: "i",
    };
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  let totalData = await warrantyModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await warrantyModel.find(query).skip(startIndex).limit(limit);

  const data = await warrantyModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "repairs",
        localField: "repair_id",
        foreignField: "_id",
        as: "repair_data",
      },
    },
    {
      $lookup: {
        from: "repair_status_histories",
        localField: "_id",
        foreignField: "warranty_id",
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
        warranty_id: 1,
        repair_id: 1,
        service_charge: 1,
        repair_by: 1,
        repair_status: 1,
        delivery_status: 1,
        due_amount: 1,
        discount_amount: 1,
        payment_info: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        repair_data: 1,

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
  const data = await warrantyModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "repairs",
        localField: "repair_id",
        foreignField: "_id",
        as: "repair_data",
      },
    },
    {
      $lookup: {
        from: "repair_status_histories",
        localField: "_id",
        foreignField: "warranty_id",
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
        warranty_id: 1,
        repair_id: 1,
        service_charge: 1,
        repair_by: 1,
        repair_status: 1,
        delivery_status: 1,
        due_amount: 1,
        discount_amount: 1,
        payment_info: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        repair_data: 1,

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
      },
    },
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data[0] });
});
async function createStatusHistory(session, req, warrantyId, decodedData) {
  console.log("req.body.repair_status:", req.body.repair_status);
  const newStatusData = {
    user_id: new mongoose.Types.ObjectId(req.body?.repair_by),
    warranty_id: new mongoose.Types.ObjectId(warrantyId),
    repair_id: new mongoose.Types.ObjectId(req.body?.repair_id),
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

const createData = catchAsyncError(async (req, res, next) => {
  // console.log("req.body.product_details:", req.body.product_details);

  // Step 0: Generate new repair_id
  const lastDoc = await warrantyModel.find().sort({ _id: -1 });
  let newId;
  if (lastDoc.length > 0) {
    const serial = lastDoc[0].warranty_id.slice(0, 2);
    const number = parseInt(lastDoc[0].warranty_id.slice(2)) + 1;
    newId = serial.concat(number);
  } else {
    newId = "WN10000";
  }

  // Step 1: Decode JWT
  const { token } = req.cookies;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  // Step 2: Start session
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 2a: Create warranty
      const newWarranyData = {
        ...req.body,
        warranty_id: newId,
        created_by: decodedData?.user?.email,
      };
      const data = await warrantyModel.create([newWarranyData], { session });
      const warranty = data[0];

      if (!warranty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Failed to create warranty" });
      }

      // 2b: Create status history
      const statusData = await createStatusHistory(
        session,
        req,
        warranty._id,
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
          "Warranty Income",
          warranty._id, // transaction_source_id
          req.body.billCollections, // transaction_info
          "warranty", // transaction_source_type
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
      // 2e: Send success response
      return res.status(201).json({
        message: "Success",
        data: warranty,
        statusData,
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
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const existingRepair = await warrantyModel.findById(req.params.id);
  if (!existingRepair) {
    return next(new ErrorHander("No data found", 404));
  }
  // Step 2: Start session
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 2a: Create warranty

      const updatedData = {
        ...req.body,
        updated_by: decodedData?.user?.email,
        updated_at: new Date(),
      };

      const warranty = await warrantyModel.findByIdAndUpdate(
        req.params.id,
        updatedData,
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
          session,
        }
      );

      if (!warranty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Failed to update repair" });
      }

      // 2b: Create status history
      const statusData = await createStatusHistory(
        session,
        req,
        warranty._id,
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
          "Warranty Income",
          warranty._id, // transaction_source_id
          req.body.billCollections, // transaction_info
          "warranty", // transaction_source_type
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
      // 2e: Send success response
      return res.status(201).json({
        message: "Success",
        data: warranty,
        statusData,
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

// const createData = catchAsyncError(async (req, res, next) => {
//   console.log("warranty createData ****************************");

//   const { token } = req.cookies;
//   const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//   const repair_id = mongoose.Types.ObjectId(req.body.repair_id);

//   let existingWarranty = await warrantyModel.findOne({ repair_id });
//   console.log("existingWarranty", existingWarranty);

//   if (!existingWarranty) {
//     const newDocument = {
//       ...req.body,
//       created_by: decodedData?.user?.email,
//     };

//     let data = await warrantyModel.create(newDocument);
//     res.send({ message: "success", status: 201, data: data });
//   } else {
//     let data = await warrantyModel.findByIdAndUpdate(
//       existingWarranty._id,
//       {
//         $set: {
//           ...req.body,
//           updated_by: decodedData?.user?.email,
//           updated_at: new Date(),
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//         useFindAndModified: false, // should be useFindAndModify
//       }
//     );

//     res.send({ message: "success", status: 201, data: data });
//   }
// });

// Note : this function is for only one sku update status of repair attached spareparts inactive and adjust stock counter collection

module.exports = {
  getDataWithPagination,
  getById,
  createData,
  updateData,
};
