const customerModel = require("../db/models/customerModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await customerModel.find().lean();
  const data = await customerModel.find({}, "name customer_id").lean();

  console.log("customer list----------------", data);

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
    query.name = { $regex: req.query.name, $options: "i" };
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.mobile) {
    query.mobile = new RegExp(`^${req.query.mobile}$`, "i");
  }
  if (req.query.email) {
    query.email = new RegExp(`^${req.query.email}$`, "i");
  }
  let totalData = await customerModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await customerModel.find(query).skip(startIndex).limit(limit);
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
  let data = await customerModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  let newIdserial;
  let newIdNo;
  let newId;
  const lastDoc = await customerModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].customer_id.slice(0, 3);
    newIdNo = parseInt(lastDoc[0].customer_id.slice(3)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "cus100";
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    customer_id: newId,
    created_by: decodedData?.user?.email,
  };

  const data = await customerModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await customerModel.findById(req.params.id);
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

  data = await customerModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

//   const childrenParentUpdate = await customerModel.updateMany(
//     { parent_name: oldParentName },
//     { $set: { parent_name: name } }
//   );
  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    //childrenParentUpdate,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await customerModel.findById(req.params.id);
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
};
