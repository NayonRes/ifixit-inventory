const questionModel = require("../db/models/questionModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const { default: mongoose } = require("mongoose");
const formatDate = require("../utils/formatDate");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  let query = {
    // Exclude documents where name is "Primary"
  };

  if (req.query.question) {
    query.question = new RegExp(`^${req.query.question}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  // if (req.query.parent_name) {
  //   query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  // }
  if (req.query.order_no && !isNaN(req.query.order_no)) {
    query.order_no = parseInt(req.query.order_no);
  }
  if (req.query.parent_id) {
    query.parent_id = new mongoose.Types.ObjectId(req.query.parent_id);
  }
  let totalData = await questionModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await questionModel
  //   .find(query)
  //   .sort({ order_no: -1 })
  //   .skip(startIndex)
  //   .limit(limit);

  const data = await questionModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "services",
        localField: "source_id",
        foreignField: "_id",
        as: "services_data",
      },
    },

    {
      $project: {
        _id: 1,
        question: 1,
        answer: 1,
        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        services_data: 1,
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
  let data = await questionModel.findById(req.params.id);
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

  const data = await questionModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;
  if (req.body.parent_id === "") {
    req.body.parent_id = null;
  }
  let data = await questionModel.findById(req.params.id);

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let newData = req.body;

  newData = {
    ...newData,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  console.log("newData", newData);

  data = await questionModel.findByIdAndUpdate(req.params.id, newData, {
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

module.exports = {
  getDataWithPagination,
  getById,
  createData,
  updateData,
};
