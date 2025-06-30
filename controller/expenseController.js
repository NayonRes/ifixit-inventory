const expenseModel = require("../db/models/expenseModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const formatDate = require("../utils/formatDate");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};

  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  if (req.query.expense_category_id) {
    query.expense_category_id = new mongoose.Types.ObjectId(
      req.query.expense_category_id
    );
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  console.log("startDate", startDate);
  if (startDate && endDate) {
    query.expense_date = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    query.expense_date = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    query.expense_date = {
      $lte: formatDate(endDate, "end", false),
    };
  }
  let totalData = await expenseModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await expenseModel.find(query).skip(startIndex).limit(limit);

  const data = await expenseModel.aggregate([
    {
      $match: query,
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
        from: "expense_categories",
        localField: "expense_category_id",
        foreignField: "_id",
        as: "expense_category_data",
      },
    },

    {
      $project: {
        _id: 1,

        amount: 1,
        expense_date: 1,
        branch_id: 1,
        expense_category_id: 1,

        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "branch_data.name": 1,
        "expense_category_data.name": 1,
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
  let data = await expenseModel.findById(req.params.id);
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

  const data = await expenseModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  let data = await expenseModel.findById(req.params.id);

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

  data = await expenseModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  // const childrenParentUpdate = await expenseModel.updateMany(
  //   { parent_name: oldParentName },
  //   { $set: { parent_name: name } }
  // );
  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    // childrenParentUpdate,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await expenseModel.findById(req.params.id);
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
