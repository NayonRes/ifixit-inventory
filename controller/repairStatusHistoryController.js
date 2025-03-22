const repairStatusHistoryModel = require("../db/models/repairStatusHistoryModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  if (req.query.repair_status_name) {
    query.repair_status_name = new RegExp(
      `^${req.query.repair_status_name}$`,
      "i"
    );
  }
  if (req.query.user_id) {
    query.user_id = new mongoose.Types.ObjectId(req.query.user_id);
  }
  if (req.query.repair_id) {
    query.repair_id = new mongoose.Types.ObjectId(req.query.repair_id);
  }
  if (req.query.updated_by) {
    query.updated_by = new RegExp(`^${req.query.updated_by}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  let totalData = await repairStatusHistoryModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  //const data = await repairStatusHistoryModel.find(query).skip(startIndex).limit(limit);

  const data = await repairStatusHistoryModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_data",
      },
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
        from: "users",
        localField: "updated_by",
        foreignField: "email",
        as: "updated_by_data",
      },
    },

    {
      $project: {
        _id: 1,
        user_id: 1,
        repair_id: 1,
        repair_status_name: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "user_data._id": 1,
        "user_data.name": 1,
        "user_data.email": 1,
        "updated_by_data.name": 1,
        "updated_by_data.email": 1,
        "updated_by_data._id": 1,
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
  const data = await repairStatusHistoryModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_data",
      },
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
        from: "users",
        localField: "updated_by",
        foreignField: "email",
        as: "updated_by_data",
      },
    },

    {
      $project: {
        _id: 1,
        user_id: 1,
        repair_id: 1,
        repair_status_name: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "user_data.name": 1,
        "updated_by_data.name": 1,
        "updated_by_data.email": 1,
        "updated_by_data._id": 1,
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
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    created_by: decodedData?.user?.email,
  };

  const data = await repairStatusHistoryModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  let data = await repairStatusHistoryModel.findById(req.params.id);
  console.log("data", data);
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
  console.log("newData", newData);
  data = await repairStatusHistoryModel.findByIdAndUpdate(
    req.params.id,
    newData,
    {
      new: true,
      runValidators: true,
      useFindAndModified: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await repairStatusHistoryModel.findById(req.params.id);
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
