const repairModel = require("../db/models/repairModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query================", req.query);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.repair_status) {
    query.repair_status = {
      $regex: `^${req.query.repair_status}$`,
      $options: "i",
    };
  }
  if (req.query.payment_status) {
    query.payment_status = {
      $regex: `^${req.query.payment_status}$`,
      $options: "i",
    };
  }
  if (req.query.repair_id) {
    query.repair_id = {
      $regex: `^${req.query.repair_id}$`,
      $options: "i",
    };
  }
  if (req.query.model_id) {
    query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.customer_id) {
    query.customer_id = new mongoose.Types.ObjectId(req.query.customer_id);
  }
  if (req.query.brand_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
  }

  console.log("startDate", startDate);
  if (startDate && endDate) {
    query.created_at = {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
      $lte: new Date(`${endDate}T23:59:59.999Z`),
    };
  } else if (startDate) {
    query.created_at = {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
    };
  } else if (endDate) {
    query.created_at = {
      $lte: new Date(`${endDate}T23:59:59.999Z`),
    };
  }

  let totalData = await repairModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await repairModel.find(query).skip(startIndex).limit(limit);

  const data = await repairModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
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
      $project: {
        _id: 1,
        serial: 1,
        pass_code: 1,
        customer_id: 1,
        branch_id: 1,
        due: 1,
        repair_id: 1,
        repair_by: 1,
        repair_status: 1,
        issues: 1,
        delivery_status: 1,
        repair_checklist: 1,
        payment_info: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "customer_data.name": 1,
        "brand_data.name": 1,
        "branch_data.name": 1,
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

  const data = await repairModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand_data",
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
      $project: {
        _id: 1,
        serial: 1,
        pass_code: 1,
        customer_id: 1,
        branch_id: 1,
        due: 1,
        repair_id: 1,
        repair_by: 1,
        repair_status: 1,
        issues: 1,
        delivery_status: 1,
        repair_checklist: 1,
        payment_info: 1,

        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "customer_data.name": 1,
        "brand_data.name": 1,
        "branch_data.name": 1,
      },
    },
  ]);

  if (!data || data.length === 0) {
    return next(new ErrorHander("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "success",
    data: data[0],
  });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("req.files--------", req.files);
  console.log("req.body------------", req.body);

  let newIdserial;
  let newIdNo;
  let newId;
  const lastDoc = await repairModel.find().sort({ _id: -1 });

  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].brand_id.slice(0, 2);
    newIdNo = parseInt(lastDoc[0].brand_id.slice(2)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "RN10000";
  }

  const { token } = req.cookies;
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let newData = {
    ...req.body,
    repair_id: newId,
    created_by: decodedData?.user?.email,
  };
  const data = await repairModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    let data = await repairModel.findById(req.params.id);

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
    let updateData = await repairModel.findByIdAndUpdate(
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
      data: updateData,
    });
  } catch (error) {
    console.log("error", error);
    res.send({ message: "error", status: 400, error: error });
  }
};

const deleteData = catchAsyncError(async (req, res, next) => {
  let data = await repairModel.findById(req.params.id);
  console.log("data", data.images);
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
