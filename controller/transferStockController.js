const transferStockModel = require("../db/models/transferStockModel");
const sparePartsStockModel = require("../db/models/sparePartsStockModel");
const stockCounterAndLimitModel = require("../db/models/stockCounterAndLimitModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const stockCounterAndLimitController = require("../controller/stockCounterAndLimitController");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query================", req.query);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};

  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }

  if (req.query.transfer_status) {
    query.status = req.query.status;
  }

  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }

  let totalData = await transferStockModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await transferStockModel.find(query).skip(startIndex).limit(limit);

  const data = await transferStockModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "branches",
        localField: "transfer_from",
        foreignField: "_id",
        as: "transfer_from_data",
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "transfer_to",
        foreignField: "_id",
        as: "transfer_to_data",
      },
    },

    {
      $project: {
        _id: 1,
        transfer_from: 1,
        transfer_to: 1,
        transfer_stocks_sku: 1,
        transfer_status: 1,
        shipping_charge: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "transfer_from_data.name": 1,
        "transfer_from_data.parent_name": 1,
        "transfer_to_data.name": 1,
        "transfer_to_data.parent_name": 1,
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

  const data = await transferStockModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "branches",
        localField: "transfer_from",
        foreignField: "_id",
        as: "transfer_from_data",
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "transfer_to",
        foreignField: "_id",
        as: "transfer_to_data",
      },
    },
    {
      $unwind: {
        path: "$transfer_stocks_sku",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "spare_parts_stocks",
        localField: "transfer_stocks_sku",
        foreignField: "sku_number",
        as: "sku_details",
      },
    },
    {
      $unwind: {
        path: "$sku_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "spareparts",
        localField: "sku_details.spare_parts_id",
        foreignField: "_id",
        as: "spare_parts_details",
      },
    },
    {
      $unwind: {
        path: "$spare_parts_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "sparepartvariations",
        localField: "sku_details.spare_parts_variation_id",
        foreignField: "_id",
        as: "spare_parts_variation_details",
      },
    },
    {
      $unwind: {
        path: "$spare_parts_variation_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Join with the purchases collection
    {
      $lookup: {
        from: "purchases",
        localField: "sku_details.purchase_id",
        foreignField: "_id",
        as: "purchase_details",
      },
    },
    {
      $unwind: {
        path: "$purchase_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Join with the purchase_products collection
    {
      $lookup: {
        from: "purchaseproducts",
        localField: "sku_details.purchase_product_id",
        foreignField: "_id",
        as: "purchase_product_details",
      },
    },
    {
      $unwind: {
        path: "$purchase_product_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        transfer_from: { $first: "$transfer_from" },
        transfer_to: { $first: "$transfer_to" },
        transfer_stocks_sku: { $first: "$transfer_stocks_sku" },
        transfer_status: { $first: "$transfer_status" },
        shipping_charge: { $first: "$shipping_charge" },
        remarks: { $first: "$remarks" },
        status: { $first: "$status" },
        created_by: { $first: "$created_by" },
        created_at: { $first: "$created_at" },
        updated_by: { $first: "$updated_by" },
        updated_at: { $first: "$updated_at" },
        transfer_from_data: { $first: "$transfer_from_data" },
        transfer_to_data: { $first: "$transfer_to_data" },
        sku_details: { $push: "$sku_details" },
        spare_parts_details: { $push: "$spare_parts_details" },
        spare_parts_variation_details: {
          $push: "$spare_parts_variation_details",
        },
        purchase_details: { $push: "$purchase_details" },
        purchase_product_details: { $push: "$purchase_product_details" },
      },
    },
    {
      $project: {
        _id: 1,
        transfer_from: 1,
        transfer_to: 1,
        transfer_stocks_sku: 1,
        transfer_status: 1,
        shipping_charge: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        transfer_from_data: 1,
        transfer_to_data: 1,
        sku_details: 1,
        spare_parts_details: 1,
        spare_parts_variation_details: 1,
        purchase_details: 1,
        purchase_product_details: 1,
      },
    },
  ]);

  if (!data || data.length === 0) {
    return next(new ErrorHander("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "success",
    data: data[0], // Access the first (and only) document in the array
  });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("req.body------------", req.body);

  const { token } = req.cookies;
  const lastDoc = await transferStockModel.find().sort({ _id: -1 });
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    created_by: decodedData?.user?.email,
  };
  const data = await transferStockModel.create(newData);
  console.log("transfer skus", newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
  console.log("asdasdfasdfasdfasdfs====================updateData");
  let data = await transferStockModel.findById(req.params.id);
  console.log("get By Id", data);
  const { token } = req.cookies;
  const { transfer_stocks_sku, transfer_from, transfer_to, transfer_status } =
    req.body;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (
    !transfer_stocks_sku ||
    !Array.isArray(transfer_stocks_sku) ||
    transfer_stocks_sku.length === 0
  ) {
    return res.status(400).json({ message: "select at least one sku" });
  }
  if (!transfer_from || !transfer_to) {
    return res.status(400).json({ message: "Both branch are required." });
  }
  const newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  if (transfer_status != "Received") {
    data = await transferStockModel.findByIdAndUpdate(req.params.id, newData, {
      new: true,
      runValidators: true,
      useFindAndModified: false,
    });
    return res
      .status(200)
      .json({ message: "transferred stock updated successfully." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Find matching records in sparePartsStockModel
    const matchedRecords = await sparePartsStockModel
      .find({
        sku_number: { $in: transfer_stocks_sku },
      })
      .session(session);

    if (matchedRecords.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No matching records found." });
    }
    // Step 2: Process each record to update stock counters
    for (const record of matchedRecords) {
      const spare_parts_variation_id =
        record.spare_parts_variation_id.toString();
      record.branch_id = transfer_to;

      data = await sparePartsStockModel.findByIdAndUpdate(record._id, record, {
        new: true,
        runValidators: true,
        useFindAndModified: false,
        session,
      });

      const fromStockCounter = await stockCounterAndLimitModel
        .findOne({
          branch_id: transfer_from,
          spare_parts_variation_id: spare_parts_variation_id,
        })
        .session(session);

      console.log("from stock counter", fromStockCounter);

      await stockCounterAndLimitController.decrementStock(
        fromStockCounter.branch_id,
        fromStockCounter.spare_parts_variation_id,
        1,
        session
      );

      // Find or Create toStock

      const toStockCounter = await stockCounterAndLimitModel
        .findOne({
          branch_id: transfer_to,
          spare_parts_variation_id,
        })
        .session(session);

      console.log("to stock counter", toStockCounter);
      if (toStockCounter != null) {
        await stockCounterAndLimitController.incrementStock(
          transfer_to,
          spare_parts_variation_id,
          1,
          session
        );
      } else {
        const newDocument = {
          branch_id: transfer_to,
          spare_parts_variation_id: fromStockCounter.spare_parts_variation_id,
          spare_parts_id: fromStockCounter.spare_parts_id,
          total_stock: 1,
        };
        await stockCounterAndLimitModel.create([newDocument], { session });
      }
    }

    data = await transferStockModel.findByIdAndUpdate(req.params.id, newData, {
      new: true,
      runValidators: true,
      useFindAndModified: false,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "sku transferred and stock updated successfully." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error on transfer sku:", error);
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

const deleteData = catchAsyncError(async (req, res, next) => {
  let data = await transferStockModel.findById(req.params.id);
  console.log("data", data.images);
  if (!data) {
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
