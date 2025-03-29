const repairAttachedSparepartsModel = require("../db/models/repairAttachedSparepartsModel");
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
  if (req.query.repair_id) {
    query.repair_id = new mongoose.Types.ObjectId(req.query.repair_id);
  }

  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  let totalData = await repairAttachedSparepartsModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await repairAttachedSparepartsModel
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
  const data = await repairAttachedSparepartsModel.aggregate([
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

const createData2 = catchAsyncError(async (req, res, next) => {
  // Fetch the purchase product
  const myPurchaseProduct = await purchaseProductModel.findById({
    _id: req.body.purchase_product_id,
  });
  if (!myPurchaseProduct) {
    return res
      .status(404)
      .send({ message: "Purchase product not found", status: 404 });
  }

  if (myPurchaseProduct.purchase_product_status !== "Received") {
    return res.status(400).send({
      message: "purchase product status must be Received.",
      status: 400,
    });
  }

  // Start a MongoDB session for a transaction

  const session = await mongoose.startSession();
  session.startTransaction();

  console.log("-----------session started-----------", new Date());
  const { token } = req.cookies;
  let quantity = 0;
  quantity = parseInt(req.body.quantity);
  const purchaseProductId = req.body.purchase_product_id;

  console.log("--------------------req.body---------", req.body);

  // Validate request data
  if (!quantity || !purchaseProductId) {
    return res.status(400).send({ message: "Invalid input", status: 400 });
  }

  const updatedProduct = await purchaseProductModel.findOneAndUpdate(
    { _id: purchaseProductId, is_sku_generated: false }, // Ensure no SKU is generated
    { $set: { is_sku_generated: true } },
    { session, new: true }
  );
  if (!updatedProduct) {
    return res.status(400).send({
      message: "SKU already generated for this purchase product.",
      status: 400,
    });
  }

  try {
    // Atomic counter update with `$inc`
    const counter = await counterModel.findOneAndUpdate(
      { key: "productSku" },
      { $inc: { counter: quantity } },
      { upsert: true, returnDocument: "after", session }
    );

    // Calculate serial numbers
    const startSerial = counter.counter - quantity + 1;
    const endSerial = counter.counter;

    // Decode token to get user details
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decodedData?.user?.email;

    console.log("decodedData", decodedData);

    // Prepare new product data
    const newSpareParts = Array.from({ length: quantity }, (_, i) => ({
      ...req.body,
      sku_number: startSerial + i, // Generate SKU numbers
      created_by: createdBy,
    }));
    console.log("newSpareParts", newSpareParts);

    // Insert the new product
    const data = await repairAttachedSparepartsModel.insertMany(newSpareParts, {
      session,
    });

    // Update the purchase product to mark SKU as generated
    // await purchaseProductModel.findOneAndUpdate(
    //   { _id: purchaseProductId },
    //   { $set: { is_sku_generated: true } },
    //   { session }
    // );

    //stock counter

    const { branch_id, product_variation_id, product_id } = req.body;
    const filter = {
      branch_id,
      product_variation_id,
      product_id,
    };

    const existingDocument = await stockCounterAndLimitModel
      .findOne(filter)
      .session(session);

    if (existingDocument) {
      await stockCounterAndLimitModel.updateOne(
        filter,
        { $inc: { total_stock: quantity } },
        { session }
      );
    } else {
      const newDocument = {
        branch_id,
        product_variation_id,
        product_id,
        total_stock: quantity,
        created_by: decodedData?.user?.email,
      };
      await stockCounterAndLimitModel.create([newDocument], { session });
    }

    // Commit the transaction
    await session.commitTransaction();
    console.log(
      `Serial numbers from SN${startSerial} to SN${endSerial} created.`
    );
    res.status(201).send({ message: "Success", status: 201, data });
  } catch (error) {
    // Roll back the transaction in case of an error
    await session.abortTransaction();
    console.error("Error processing product update:", error);
    res.status(500).send({ message: error, status: 201, data });
  } finally {
    // End the session
    session.endSession();
  }
});
const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { repair_id, sku_numbers } = req.body;

  console.log("repair_id", repair_id);
  console.log("sku_numbers", sku_numbers);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (!sku_numbers || sku_numbers.length === 0) {
    return res.status(400).json({ message: "select at least one sku" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let newAttachedCollectionData = sku_numbers.map((sku_number) => ({
      repair_id: repair_id,
      sku_number: sku_number,
      created_by: decodedData?.user?.email,
    }));
    console.log(
      "newAttachedCollectionData *****************************",
      newAttachedCollectionData
    );
    //  Insert multiple records in transaction
    const data = await repairAttachedSparepartsModel.insertMany(
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
    let alreadyReturned = [];
    let matchedRecordForStockCounterAdjustment = [];
    let listOfUpdateStock = [];
    let stockListOfAnotherBranch = [];
    for (const record of matchedRecords) {
      const product_variation_id = record.product_variation_id.toString();
      const branch_id = record.branch_id.toString();
      const purchase_branch_id = record.purchase_branch_id.toString();
      const product_id = record.product_id.toString();
      if (record.stock_status === "Returned") {
        alreadyReturned.push(record.sku_number);
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
              stock_status: "Attached",

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
    if (alreadyReturned.length > 0) {
      await session.abortTransaction(); // Cancel the session (transaction)
      session.endSession(); // End the session
      const message = `Stock ${alreadyReturned.join(
        ", "
      )} already returned. So operation Failed`;
      return res.status(400).json({
        success: false,
        message: message,
        alreadyReturned: alreadyReturned,
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
const removeStockAdjustment2 = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  // repair_id: row?._id,

  // sku_number: removeSkuDetails?.sku_number,
  // remarks: stockRemarks,

  const { stockStatus, sku_number, remarks, adjustment_data } = req.body;

  console.log("stockStatus", stockStatus);

  if (stockStatus !== "Available" && stockStatus !== "Abnormal") {
    return res
      .status(400)
      .json({ message: "Selected status is not allowed for adjustment" });
  }

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (sku_number > 0) {
    return res.status(400).json({ message: "select at least one sku" });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const matchedRecords = await stockModel
      .find({
        sku_number: sku_number,
      })
      .session(session);

    console.log("matchedRecords", matchedRecords);

    if (matchedRecords.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "No records found with one of skus." });
    }
    // checking matchedStatusDBData for rejecting request if stock's previous status same
    let matchedStatusDBData = matchedRecords?.filter(
      (item) => item?.stock_status === stockStatus
    );
    console.log("matchedStatusDBData", matchedStatusDBData);

    if (matchedStatusDBData.length > 0) {
      let matchedStatusList = matchedStatusDBData.map(
        (item) => item.sku_number
      );
      const message = `Stock ${matchedStatusList.join(
        ", "
      )} status already ${stockStatus}. So operation failed`;
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: message });
    }
    let notThisBranchProduct = [];
    let matchedRecordForStockCounterAdjustment = [];
    let listOfUpdateStock = [];
    // let stockListOfAnotherBranch = []; // if any data requesed data is from anothe branch a abortTransaction and endSession
    for (const record of matchedRecords) {
      const product_variation_id = record.product_variation_id.toString();
      const branch_id = record.branch_id.toString();
      const purchase_branch_id = record.purchase_branch_id.toString();
      const product_id = record.product_id.toString();

      // if (branch_id !== purchase_branch_id) {
      //   stockListOfAnotherBranch.push(record.sku_number);
      //   continue;
      // }
      if (branch_id !== decodedData?.user?.branch_id) {
        notThisBranchProduct.push(record.sku_number);
        continue;
      }
      const matchedStock = matchedRecordForStockCounterAdjustment.find(
        (entry) =>
          entry.branch_id === branch_id &&
          entry.product_variation_id === product_variation_id
      );
      if (stockStatus === "Available" && record.stock_status !== "Available") {
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
      } else if (
        stockStatus === "Abnormal" &&
        record.stock_status === "Available"
      ) {
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

      // const remarks = adjustment_data.find(
      //   (res) => res.sku_number === parseInt(record.sku_number)
      // )?.remarks;

      listOfUpdateStock.push({
        updateOne: {
          filter: { _id: record._id },
          update: {
            $set: {
              stock_status: stockStatus,
              remarks: remarks || "", // Ensure `remarks` is not undefined
              updated_by: decodedData?.user?.email,
              updated_at: new Date(),
            },
          },
        },
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
    // if (stockListOfAnotherBranch.length > 0) {
    //   await session.abortTransaction(); // Cancel the session (transaction)
    //   session.endSession(); // End the session
    //   const message = `Stock ${stockListOfAnotherBranch.join(
    //     ", "
    //   )} purchased by another branch. so you can not return. So operation failed`;
    //   return res.status(400).json({
    //     success: false,
    //     message: message,
    //     stockListOfAnotherBranch: stockListOfAnotherBranch,
    //   });
    // }

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

      // finding for status abnormal decrement stock count

      const stockCounterData = await stockCounterAndLimitModel
        .findOne({
          branch_id: element?.branch_id,
          product_variation_id: element?.product_variation_id,
        })
        .session(session);
      if (stockStatus === "Available") {
        if (!stockCounterData) {
          // If stock does not exist at the destination, create a new entry
          const newStock = new stockCounterAndLimitModel({
            branch_id: element.branch_id,
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
            element?.branch_id,
            element?.product_variation_id,
            element?.matched,
            session
          );
        }
      }

      if (stockStatus === "Abnormal") {
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
      message: "Successfully Adjusted",

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
const removeStockAdjustment = catchAsyncError(async (req, res, next) => {
  console.log("removeStockAdjustment", removeStockAdjustment);

  const { token } = req.cookies;
  const {
    stockStatus,
    sku_number,
    remarks,
    adjustment_data,
    repair_id,
    repair_attached_stock_id,
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

    if (stockStatus === "Available") {
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
    } else if (stockStatus === "Abnormal") {
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

    await repairAttachedSparepartsModel.updateOne(
      { _id: repair_attached_stock_id }, // Match by _id
      {
        $set: {
          status: false,
          updatedAt: new Date(),
          updatedBy: decodedData?.user?.email,
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
  let data = await repairAttachedSparepartsModel.findById(req.params.id);
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
