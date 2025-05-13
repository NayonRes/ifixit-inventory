const saleAttachedProductModel = require("../db/models/saleAttachedProductModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const purchaseModel = require("../db/models/purchaseModel");
const stockCounterAndLimitModel = require("../db/models/stockCounterAndLimitModel");
const purchaseProductModel = require("../db/models/purchaseProductModel");
const stockCounterAndLimitController = require("../controller/stockCounterAndLimitController");
const stockModel = require("../db/models/stockModel");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 1000;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  // if (req.query.name) {
  //   query.name = new RegExp(`^${req.query.name}$`, "i");
  // }
  if (req.query.sale_id) {
    query.sale_id = new mongoose.Types.ObjectId(req.query.sale_id);
  }

  if (req.query.is_warranty_claimed_sku) {
    query.is_warranty_claimed_sku =
      req.query.is_warranty_claimed_sku === "true";
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  let totalData = await saleAttachedProductModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await saleAttachedProductModel
    .find(query)
    .sort({ order_no: -1 })
    .skip(startIndex)
    .limit(limit);
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
  const data = await saleAttachedProductModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "product_variation_id",
        foreignField: "_id",
        as: "sparepartvariation_data",
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
        from: "branches",
        localField: "purchase_branch_id",
        foreignField: "_id",
        as: "purchase_branch_data",
      },
    },
    {
      $lookup: {
        from: "purchases",
        localField: "purchase_id",
        foreignField: "_id",
        as: "purchase_data",
      },
    },
    {
      $project: {
        _id: 1,
        product_id: 1,
        product_variation_id: 1,
        branch_id: 1,
        purchase_branch_id: 1,
        purchase_id: 1,
        sku_number: 1,
        stock_status: 1,
        product_id: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "product_data.name": 1,
        "branch_data.name": 1,
        "purchase_branch_data.name": 1,
        "sparepartvariation_data.name": 1,
        "purchase_data.purchase_date": 1,
        "purchase_data.is_sku_generated": 1,
        "purchase_data.supplier_id": 1,
      },
    },
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { sale_id, sku_numbers, is_warranty_claimed_sku } = req.body;

  console.log("sale_id", sale_id);
  console.log("sku_numbers", sku_numbers);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (!sku_numbers || sku_numbers.length === 0) {
    return res.status(400).json({ message: "select at least one sku" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let newAttachedCollectionData = sku_numbers.map((sku_number) => ({
      sale_id: sale_id,
      is_warranty_claimed_sku: is_warranty_claimed_sku,
      sku_number: sku_number,
      created_by: decodedData?.user?.email,
    }));
    console.log(
      "newAttachedCollectionData *****************************",
      newAttachedCollectionData
    );
    //  Insert multiple records in transaction
    const data = await saleAttachedProductModel.insertMany(
      newAttachedCollectionData,
      { session }
    );

    console.log("sku_numbers", sku_numbers);

    const matchedRecords = await stockModel
      .find({
        sku_number: { $in: sku_numbers },
      })
      .session(session);

    console.log("match skus", matchedRecords);

    if (matchedRecords.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "No records found with one of skus." });
    }
    let notThisBranchProduct = [];
    let notAttachable = [];
    let matchedRecordForStockCounterAdjustment = [];
    let listOfUpdateStock = [];
    let stockListOfAnotherBranch = [];
    for (const record of matchedRecords) {
      const product_variation_id = record.product_variation_id.toString();
      const branch_id = record.branch_id.toString();
      const purchase_branch_id = record.purchase_branch_id.toString();
      const product_id = record.product_id.toString();
      // if (record.stock_status === "Returned") {
      //   notAttachable.push(record.sku_number);
      //   continue;
      // }

      if (
        ["Returned", "Attached", "Abnormal", "Sold"].includes(
          record.stock_status
        )
      ) {
        notAttachable.push(record.sku_number);
        continue;
      }
      if (branch_id !== decodedData?.user?.branch_id) {
        notThisBranchProduct.push(record.sku_number);
        continue;
      }
      if (branch_id !== purchase_branch_id) {
        stockListOfAnotherBranch.push(record.sku_number);
        continue;
      }
      if (record.stock_status === "Available") {
        const matchedStock = matchedRecordForStockCounterAdjustment.find(
          (entry) =>
            entry.branch_id === branch_id &&
            entry.product_variation_id === product_variation_id
        );

        if (matchedStock) {
          matchedStock.matched += 1;
        } else {
          matchedRecordForStockCounterAdjustment.push({
            branch_id: branch_id,
            product_variation_id,
            product_id,
            matched: 1,
          });
        }
      }

      listOfUpdateStock.push({
        updateOne: {
          filter: { _id: record._id },
          update: {
            $set: {
              stock_status: "Sold",

              updated_by: decodedData?.user?.email,
              updated_at: new Date(),
            },
          },
        },
      });
    }
    if (stockListOfAnotherBranch.length > 0) {
      await session.abortTransaction(); // Cancel the session (transaction)
      session.endSession(); // End the session
      const message = `Stock ${stockListOfAnotherBranch.join(
        ", "
      )} purchased by another branch. So Operation failed`;
      return res.status(400).json({
        success: false,
        message: message,
        stockListOfAnotherBranch: stockListOfAnotherBranch,
      });
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
    if (notAttachable.length > 0) {
      await session.abortTransaction(); // Cancel the session (transaction)
      session.endSession(); // End the session
      const message = `Stock ${notAttachable.join(
        ", "
      )} not attachable. So operation Failed`;
      return res.status(400).json({
        success: false,
        message: message,
        notAttachable: notAttachable,
      });
    }
    if (listOfUpdateStock.length > 0) {
      await stockModel.bulkWrite(listOfUpdateStock, {
        session,
      });
    }
    let newAbortTransaction = false; // Flag to track if transaction should be aborted
    for (
      let index = 0;
      index < matchedRecordForStockCounterAdjustment.length;
      index++
    ) {
      const element = matchedRecordForStockCounterAdjustment[index];

      // finding for decrement stock count

      const stockCounterData = await stockCounterAndLimitModel
        .findOne({
          branch_id: element?.branch_id,
          product_variation_id: element?.product_variation_id,
        })
        .session(session);
      if (!stockCounterData) {
        console.error("stockCounterData not found:", {
          branch_id: element?.branch_id,
          product_variation_id: element?.product_variation_id,
        });

        newAbortTransaction = true; // Set flag to abort after loop
        break;
      }

      console.log("from stock counter", stockCounterData);

      await stockCounterAndLimitController.decrementStock(
        element?.branch_id,
        element?.product_variation_id,
        element.matched,
        session
      );
    }

    // If flag is set to abort, abort transaction
    if (newAbortTransaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Stock for the source branch not found or not matched.",
      });
    }
    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "SKU returned successfully",

      listOfUpdateStock: listOfUpdateStock,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error on return sku:", error);
    return res.status(500).json({ message: "An error occurred.", error });
  } finally {
    session.endSession();
  }
});

// Note : this function is for only one sku update status of repair attached spareparts inactive and adjust stock counter collection

const removeStockAdjustment = catchAsyncError(async (req, res, next) => {
  console.log("removeStockAdjustment", removeStockAdjustment);

  const { token } = req.cookies;
  const {
    stockStatus,
    sku_number,
    remarks,

    sale_attached_stock_id,
  } = req.body;

  if (stockStatus !== "Available" && stockStatus !== "Abnormal") {
    return res
      .status(400)
      .json({ message: "Selected status is not allowed for adjustment" });
  }

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (!sku_number) {
    return res.status(400).json({ message: "SKU number is required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await stockModel.findOne({ sku_number }).session(session);
    if (!record) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No record found for the SKU." });
    }

    if (record.stock_status === stockStatus) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Stock ${sku_number} status is already ${stockStatus}.`,
      });
    }

    if (record.branch_id.toString() !== decodedData?.user?.branch_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Stock ${sku_number} does not belong to this branch.`,
      });
    }

    await stockModel.updateOne(
      { _id: record._id },
      {
        $set: {
          stock_status: stockStatus,
          remarks: remarks || "",
          updated_by: decodedData?.user?.email,
          updated_at: new Date(),
        },
      },
      { session }
    );

    const stockCounterData = await stockCounterAndLimitModel
      .findOne({
        branch_id: record.branch_id,
        product_variation_id: record.product_variation_id,
      })
      .session(session);

    if (stockStatus === "Available" && record.stock_status !== "Available") {
      if (!stockCounterData) {
        const newStock = new stockCounterAndLimitModel({
          branch_id: record.branch_id,
          product_variation_id: record.product_variation_id,
          product_id: record.product_id,
          total_stock: 1,
          created_by: decodedData?.user?.email,
        });
        await newStock.save({ session });
      } else {
        await stockCounterAndLimitController.incrementStock(
          record.branch_id,
          record.product_variation_id,
          1,
          session
        );
      }
    } else if (
      stockStatus === "Abnormal" &&
      record.stock_status === "Available"
    ) {
      if (!stockCounterData) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: "Stock counter not found for the branch." });
      }
      await stockCounterAndLimitController.decrementStock(
        record.branch_id,
        record.product_variation_id,
        1,
        session
      );
    }

    await saleAttachedProductModel.updateOne(
      { _id: sale_attached_stock_id }, // Match by _id
      {
        $set: {
          status: false,
          updated_at: new Date(),
          updated_by: decodedData?.user?.email,
        },
      },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Successfully Adjusted" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error on return SKU:", error);
    return res.status(500).json({ message: "An error occurred.", error });
  } finally {
    session.endSession();
  }
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await saleAttachedProductModel.findById(req.params.id);
  console.log("data", data);
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
  removeStockAdjustment,
};
