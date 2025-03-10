const stockModel = require("../db/models/stockModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const purchaseModel = require("../db/models/purchaseModel");
const stockCounterAndLimitModel = require("../db/models/stockCounterAndLimitModel");
const purchaseProductModel = require("../db/models/purchaseProductModel");
const stockCounterAndLimitController = require("../controller/stockCounterAndLimitController");

const getAllStock = catchAsyncError(async (req, res, next) => {
  var query = {};
  if (req.query.sku_number) {
    query.sku_number = new RegExp(`^${req.query.sku_number}$`, "i");
  }
  if (req.query.stock_status) {
    query.stock_status = new RegExp(`^${req.query.stock_status}$`, "i");
  }
  if (req.query.product_id) {
    query.product_id = new mongoose.Types.ObjectId(req.query.product_id);
  }
  if (req.query.product_variation_id) {
    query.product_variation_id = new mongoose.Types.ObjectId(
      req.query.product_variation_id
    );
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.purchase_id) {
    query.purchase_id = new mongoose.Types.ObjectId(req.query.purchase_id);
  }
  if (req.query.purchase_product_id) {
    query.purchase_product_id = new mongoose.Types.ObjectId(
      req.query.purchase_product_id
    );
  }

  let totalData = await stockModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await stockModel.find(query);

  // const data = await stockModel.aggregate([
  //   {
  //     $match: query,
  //   },
  //   {
  //     $lookup: {
  //       from: "spareparts",
  //       localField: "product_id",
  //       foreignField: "_id",
  //       as: "sparepart_data",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "product_variations",
  //       localField: "product_variation_id",
  //       foreignField: "_id",
  //       as: "sparepartvariation_data",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "branches",
  //       localField: "branch_id",
  //       foreignField: "_id",
  //       as: "branch_data",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "purchases",
  //       localField: "purchase_id",
  //       foreignField: "_id",
  //       as: "purchase_data",
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 1,
  //       product_id: 1,
  //       product_variation_id: 1,
  //       branch_id: 1,
  //       purchase_id: 1,
  //       sku_number: 1,
  //       stock_status: 1,
  //       product_id: 1,
  //       remarks: 1,
  //       status: 1,
  //       created_by: 1,
  //       created_at: 1,
  //       updated_by: 1,
  //       updated_at: 1,

  //       "sparepart_data.name": 1,
  //       "branch_data.name": 1,
  //       "sparepartvariation_data.name": 1,
  //       "purchase_data.purchase_date": 1,
  //       "purchase_data.supplier_id": 1,
  //     },
  //   },
  //   {
  //     $sort: { created_at: -1 },
  //   },
  // ]);
  console.log("data", data);
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
    totalData: totalData,
  });
});

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  console.log("===========req.query.stock_status", req.query.stock_status);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  // if (req.query.sku_number) {
  //   query.sku_number = new RegExp(`^${req.query.sku_number}$`, "i");
  // }

  if (req.query.product_id) {
    query.product_id = new mongoose.Types.ObjectId(req.query.product_id);
  }
  if (req.query.product_variation_id) {
    query.product_variation_id = new mongoose.Types.ObjectId(
      req.query.product_variation_id
    );
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.purchase_id) {
    query.purchase_id = new mongoose.Types.ObjectId(req.query.purchase_id);
  }
  if (req.query.stock_status) {
    query.stock_status = new RegExp(`^${req.query.stock_status}$`, "i");
  }

  if (req.query.sku_number && !isNaN(req.query.sku_number)) {
    query.sku_number = Number(req.query.sku_number);
  } else if (req.query.sku_number) {
    return res.status(400).json({
      success: false,
      message: "Invalid sku number provided",
    });
  }

  let totalData = await stockModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  //const data = await stockModel.find(query).skip(startIndex).limit(limit);

  const data = await stockModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "spareparts",
        localField: "product_id",
        foreignField: "_id",
        as: "sparepart_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "product_variation_id",
        foreignField: "_id",
        as: "spare_parts_variation_data",
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
      $lookup: {
        from: "purchase_products",
        let: {
          purchase_id: "$purchase_id",
          product_variation_id: "$product_variation_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$purchase_id", "$$purchase_id"] },
                  {
                    $eq: ["$product_variation_id", "$$product_variation_id"],
                  },
                ],
              },
            },
          },
        ],
        as: "purchase_products_data",
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

        "sparepart_data.name": 1,
        "branch_data.name": 1,
        "purchase_branch_data.name": 1,
        "spare_parts_variation_data.name": 1,
        "purchase_data.purchase_date": 1,
        "purchase_data.supplier_id": 1,
        purchase_products_data: 1,
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
  const data = await stockModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "spareparts",
        localField: "product_id",
        foreignField: "_id",
        as: "sparepart_data",
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

        "sparepart_data.name": 1,
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
      { key: "sparePartsSku" },
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
    const data = await stockModel.insertMany(newSpareParts, {
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

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await stockModel.findById(req.params.id);
  let oldParentName = data.name;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  data = await stockModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    childrenParentUpdate,
  });
});
// Note : decremening only when database stock data's stock_status === Avaiable
const purchaseReturn = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { purchase_return_data } = req.body;

  console.log("purchase_return_data", purchase_return_data);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (!purchase_return_data || purchase_return_data.length === 0) {
    return res.status(400).json({ message: "select at least one sku" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let sku_numbers = purchase_return_data?.map((item) =>
      parseInt(item.sku_number)
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

      const remarks = purchase_return_data.find(
        (res) => res.sku_number === parseInt(record.sku_number)
      )?.remarks;

      listOfUpdateStock.push({
        updateOne: {
          filter: { _id: record._id },
          update: {
            $set: {
              stock_status: "Returned",
              remarks: remarks || "", // Ensure `remarks` is not undefined
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
const stockAdjustment = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { stockStatus, adjustment_data } = req.body;

  console.log("stockStatus", stockStatus);
  console.log("adjustment_data", adjustment_data);

  if (stockStatus !== "Available" && stockStatus !== "Abnormal") {
    return res
      .status(400)
      .json({ message: "Selected status is not allowed for adjustment" });
  }

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  if (!adjustment_data || adjustment_data.length === 0) {
    return res.status(400).json({ message: "select at least one sku" });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let sku_numbers = adjustment_data?.map((item) => parseInt(item.sku_number));
    console.log("sku_numbers", sku_numbers);

    const matchedRecords = await stockModel
      .find({
        sku_number: { $in: sku_numbers },
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

      const remarks = adjustment_data.find(
        (res) => res.sku_number === parseInt(record.sku_number)
      )?.remarks;

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

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await stockModel.findById(req.params.id);
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
  getAllStock,
  getById,
  createData,
  updateData,
  purchaseReturn,
  stockAdjustment,
  deleteData,
};
