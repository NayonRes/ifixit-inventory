const issueModel = require("../db/models/issueModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const formatDate = require("../utils/formatDate");
const { default: mongoose } = require("mongoose");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await issueModel.find().lean();
  const data = await issueModel.find({}, "name category_id").lean();

  console.log("category list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = {};

  // if (req.query.model_id) {
  //   query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  // }

  if (req.query.model_id) {
    query.model_id = {
      $in: [new mongoose.Types.ObjectId(req.query.model_id)],
    };
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.order_no && !isNaN(req.query.order_no)) {
    query.order_no = parseInt(req.query.order_no);
  }

  if (startDate && endDate) {
    query.created_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    query.created_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    query.created_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  const totalData = await issueModel.countDocuments(query);

  const data = await issueModel.aggregate([
    { $match: query },

    {
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },

    // Sort
    {
      $sort: { created_at: 1 },
    },

    // Pagination
    // { $skip: startIndex },
    // { $limit: limit },

    // Group back to array

    {
      $project: {
        _id: 1,
        name: 1,

        model_id: 1,

        order_no: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "model_data.name": 1,
        "model_data._id": 1,
      },
    },
  ]);

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
  let data = await issueModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  const lastDoc = await issueModel.find().sort({ _id: -1 });

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,

    created_by: decodedData?.user?.email,
  };

  const data = await issueModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await issueModel.findById(req.params.id);


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

  data = await issueModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  // const childrenParentUpdate = await issueModel.updateMany(
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
  let data = await issueModel.findById(req.params.id);
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
