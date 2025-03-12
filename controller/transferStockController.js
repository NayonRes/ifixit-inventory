const transferStockModel = require("../db/models/transferStockModel");
const stockModel = require("../db/models/stockModel");
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
    const branchObjectId = new mongoose.Types.ObjectId(req.query.branch_id);
    query.$or = [
      { transfer_from: branchObjectId },
      { transfer_to: branchObjectId },
    ];
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
        from: "products",
        localField: "sku_details.product_id",
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
        from: "product_variations",
        localField: "sku_details.product_variation_id",
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
        from: "purchase_products",
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
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  if (data?.transfer_status === "Received") {
    return res.status(404).json({ message: "This is not updateable" });
  }
  console.log("get By Id", data);
  const { token } = req.cookies;
  const { transfer_stocks_sku, transfer_from, transfer_to, transfer_status } =
    req.body;

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
  const session = await mongoose.startSession();
  session.startTransaction();
  if (transfer_status !== "Received") {
    let reponseData = await transferStockModel.findByIdAndUpdate(
      req.params.id,
      newData,
      {
        new: true,
        runValidators: true,
        useFindAndModified: false,
        session,
      }
    );
    await session.commitTransaction();
    session.endSession();
    console.log("update transfer stock status only");
    return res.status(200).json({
      data: reponseData,
      message: "transferred stock updated successfully.",
    });
  }
  console.log("run below part");

  if (transfer_status === "Received" && data?.transfer_status !== "Received") {
    try {
      // Step 1: Find matching records in stockModel
      const matchedRecords = await stockModel
        .find({
          sku_number: { $in: transfer_stocks_sku },
        })
        .session(session);
      console.log("matchedRecords", matchedRecords);

      if (matchedRecords.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "No matching records found." });
      }

      // updating treansfer sku's branch id

      await stockModel.updateMany(
        { sku_number: { $in: transfer_stocks_sku } },
        {
          $set: {
            branch_id: transfer_to,
            updated_by: decodedData?.user?.email,
            updated_at: new Date(),
          },
        },
        { session }
      );
      // Process each record to update stock counters
      let notThisBranchProduct = []; // this is for if any other branch product exist in the request than failed the request
      let alreadyReturned = []; // this is for if any return product exist in the request than failed the request
      let alreadyAttached = []; // this is for if any atteched product exist in the request than failed the request
      let matchedRecordForStockAdjustment = [];
      for (const record of matchedRecords) {
        const product_variation_id = record.product_variation_id.toString();
        const branch_id = record.branch_id.toString();
        const product_id = record.product_id.toString();

        console.log("record", record);

        //checking any product of the same branch is not receiving. means if by any mistake or any how transfer own product to own branch
        if (branch_id === decodedData?.user?.branch_id) {
          notThisBranchProduct.push(record.sku_number);
          continue;
        }
        if (record.stock_status === "Returned") {
          alreadyReturned.push(record.sku_number);
          continue;
        }
        if (record.stock_status === "Attached") {
          alreadyAttached.push(record.sku_number);
          continue;
        }
        // updating branch id of stock

        const matchedIncrementStock = matchedRecordForStockAdjustment.find(
          (entry) =>
            entry.transfer_from === transfer_from &&
            entry.transfer_to === transfer_to &&
            entry.product_variation_id === product_variation_id
        );
        if (record.stock_status === "Available") {
          if (matchedIncrementStock) {
            matchedIncrementStock.matched += 1;
          } else {
            matchedRecordForStockAdjustment.push({
              transfer_from: transfer_from,
              transfer_to: transfer_to,
              product_variation_id,
              product_id,
              matched: 1,
            });
          }
        }
      }
      if (notThisBranchProduct.length > 0) {
        await session.abortTransaction(); // Cancel the session (transaction)
        session.endSession(); // End the session
        const message = `Stock ${notThisBranchProduct.join(
          ", "
        )} not this branch product. So operation Failed`;
        return res.status(400).json({
          success: false,
          message: message,
          notThisBranchProduct: notThisBranchProduct,
        });
      }
      if (alreadyReturned.length > 0) {
        await session.abortTransaction(); // Cancel the session (transaction)
        session.endSession(); // End the session
        const message = `Stock ${alreadyReturned.join(
          ", "
        )} already returned. So Operation failed`;
        return res.status(400).json({
          success: false,
          message: message,
          alreadyReturned: alreadyReturned,
        });
      }
      if (alreadyAttached.length > 0) {
        await session.abortTransaction(); // Cancel the session (transaction)
        session.endSession(); // End the session
        const message = `Stock ${alreadyAttached.join(
          ", "
        )} already returned. So Operation failed`;
        return res.status(400).json({
          success: false,
          message: message,
          alreadyAttached: alreadyAttached,
        });
      }
      let newAbortTransaction = false; // Flag to track if transaction should be aborted
      for (
        let index = 0;
        index < matchedRecordForStockAdjustment.length;
        index++
      ) {
        const element = matchedRecordForStockAdjustment[index];

        // finding for decrement stock count

        const transferFromStockCounter = await stockCounterAndLimitModel
          .findOne({
            branch_id: element?.transfer_from,
            product_variation_id: element?.product_variation_id,
          })
          .session(session);
        if (!transferFromStockCounter) {
          console.error("transferFromStockCounter not found:", {
            branch_id: element?.transfer_from,
            product_variation_id: element?.product_variation_id,
          });

          newAbortTransaction = true; // Set flag to abort after loop
          break; // Exit the loop if condition is met
        }

        console.log("from stock counter", transferFromStockCounter);

        await stockCounterAndLimitController.decrementStock(
          element?.transfer_from,
          element?.product_variation_id,
          element.matched,
          session
        );

        // Find or Create toStock

        let transferToStockCounter = await stockCounterAndLimitModel
          .findOne({
            branch_id: element?.transfer_to,
            product_variation_id: element?.product_variation_id,
          })
          .session(session);

        console.log("to stock counter", transferToStockCounter);

        if (!transferToStockCounter) {
          // If stock does not exist at the destination, create a new entry
          const newStock = new stockCounterAndLimitModel({
            branch_id: element.transfer_to,
            product_variation_id: element.product_variation_id,
            product_id: element.product_id,
            total_stock: element.matched,
            created_by: decodedData?.user?.email,
          });

          await newStock.save({ session });

          console.log("newStock", newStock);
        } else {
          // If stock already exists at the destination, just increment it
          await stockCounterAndLimitController.incrementStock(
            element?.transfer_to,
            element?.product_variation_id,
            element.matched,
            session
          );
        }
      }
      if (newAbortTransaction) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Stock for the source branch not found or not matched.",
        });
      }
      data = await transferStockModel.findByIdAndUpdate(
        req.params.id,
        newData,
        {
          new: true,
          runValidators: true,
          useFindAndModified: false,
          session,
        }
      );

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
