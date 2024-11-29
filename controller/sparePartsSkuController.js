const sparePartsSkuModel = require("../db/models/sparePartsStockModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");


const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  if (req.query.sku_number) {
    query.sku_number = new RegExp(`^${req.query.sku_number}$`, "i");
  }

  let totalData = await sparePartsSkuModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await sparePartsSkuModel.find(query).skip(startIndex).limit(limit);
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
  let data = await sparePartsSkuModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});



const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const quantity = parseInt(req.body.quantity); 

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the current counter by the key "sparePartsSku"
    const counter = await counterModel.findOne({ key: "sparePartsSku" }).session(session);
    console.log("------counter------",counter);

    const lastSerial = counter ? counter.counter : 10000000; // Default to 0 if counter doesn't exist
    const startSerial = lastSerial + 1;
    const endSerial = lastSerial + quantity;
    let decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const newSpareParts = [];
    for (let i = 0; i < quantity; i++) {
      const serialNumber = lastSerial + i+1;
      newSpareParts.push({
        ...req.body,
        sku_number: serialNumber,
        created_by: decodedData?.user?.email,
      });
    }

    console.log("----new spare parts[]---",newSpareParts);
    const data = await sparePartsSkuModel.insertMany(newSpareParts, { session });
    await counterModel.findOneAndUpdate(
      { key: "sparePartsSku" },
      { $set: { counter: endSerial } },
      { upsert: true, session }
    );

    await session.commitTransaction();
    console.log(`Serial numbers from SN${startSerial} to SN${endSerial} created.`);
    res.send({ message: "success", status: 201, data: data });
  } catch (error) {
    // Roll back the transaction in case of an error
    await session.abortTransaction();
    console.error("Error processing product update:", error);
    res.status(500).send("An error occurred while processing the product update.");
  } finally {
    // End the session
    session.endSession();
  }
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await sparePartsSkuModel.findById(req.params.id);
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

  data = await sparePartsSkuModel.findByIdAndUpdate(req.params.id, newData, {
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

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await sparePartsSkuModel.findById(req.params.id);
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
  updateData,
  deleteData,
};
