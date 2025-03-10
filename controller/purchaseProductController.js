const purchaseProductModel = require("../db/models/purchaseProductModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const getLastPurchaseItem = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  var query = {};

  // If product_variation_id is provided, use it in the query
  if (req.query.product_variation_id) {
    query.product_variation_id = new mongoose.Types.ObjectId(
      req.query.product_variation_id
    );
  }

  // Find the latest document based on created_at, limit to 1 result
  const data = await purchaseProductModel
    .find(query) // Apply the query
    .sort({ created_at: -1 }) // Sort by created_at in descending order (latest first)
    .select(
      "product_variation_id unit_price purchase_product_status created_at"
    ) // Select specific fields
    .limit(1) // Limit to the latest document
    .lean(); // Convert to plain JavaScript object

  console.log("purchase_product list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await purchaseProductModel.find().lean();
  const data = await purchaseProductModel
    .find({}, "name purchaseProduct_id")
    .lean();

  console.log("purchase_product list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  let totalData = await purchaseProductModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await purchaseProductModel
    .find(query)
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
  let data = await purchaseProductModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    created_by: decodedData?.user?.email,
  };

  const data = await purchaseProductModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await purchaseProductModel.findById(req.params.id);

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

  data = await purchaseProductModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await purchaseProductModel.findById(req.params.id);
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
  getParentDropdown,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getLastPurchaseItem,
};
