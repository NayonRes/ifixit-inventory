const saleModel = require("../db/models/saleModel");
const repairStatusHistoryModel = require("../db/models/repairStatusHistoryModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const customerModel = require("../db/models/customerModel");
const formatDate = require("../utils/formatDate");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query================", req.query);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};
  let customerId = "";

  if (req.query.customerNo?.trim()) {
    const customerData = await customerModel.find({
      mobile: new RegExp(`^${req.query.customerNo}$`, "i"),
    });
    console.log("Customer data:", customerData);

    if (customerData?.length > 0) {
      customerId = customerData[0]?._id;
    } else {
      // return res.status(404).json({
      //   success: false,
      //   message: "Customer not found with this mobile number.",
      // });

      return res.status(200).json({
        success: true,
        message: "successful",
        data: [],
        totalData: 0,
        pageNo: page,
        limit: limit,
      });
    }
  }

  console.log("executint this ***********************");

  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.serial) {
    query.serial = new RegExp(`^${req.query.serial}$`, "i");
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
  if (req.query.sale_id) {
    query.sale_id = {
      $regex: `^${req.query.sale_id}$`,
      $options: "i",
    };
  }
  if (req.query.model_id) {
    query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (customerId) {
    query.customer_id = new mongoose.Types.ObjectId(customerId);
  }
  // if (req.query.customer_id) {
  //   query.customer_id = new mongoose.Types.ObjectId(req.query.customer_id);
  // }
  // it is originally  device_id. For repair module device under primary device list is product brand list
  if (req.query.brand_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
  }

  console.log("startDate", startDate);
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

  let totalData = await saleModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await saleModel.find(query).skip(startIndex).limit(limit);

  const data = await saleModel.aggregate([
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
        from: "branches",
        localField: "branch_id",
        foreignField: "_id",
        as: "branch_data",
      },
    },
    // Lookup users for user_id inside repair_status_history_data

    // Merge repair_status_users into repair_status_history_data

    {
      $project: {
        _id: 1,
        serial: 1,
        pass_code: 1,
        customer_id: 1,
        due_amount: 1,
        discount_amount: 1,
        sale_id: 1,
        product_details: 1,
        delivery_status: 1,
        repair_checklist: 1,
        payment_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        customer_data: 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
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

  const data = await saleModel.aggregate([
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
        brand_id: 1,
        branch_id: 1,
        due_amount: 1,
        discount_amount: 1,
        sale_id: 1,

        product_details: 1,
        payment_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        customer_data: 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
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
  const lastDoc = await saleModel.find().sort({ _id: -1 });

  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].sale_id.slice(0, 2);
    newIdNo = parseInt(lastDoc[0].sale_id.slice(2)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "SL10000";
  }

  const { token } = req.cookies;
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let newData = {
    ...req.body,
    sale_id: newId,
    created_by: decodedData?.user?.email,
  };
  const data = await saleModel.create(newData);

  console.log("data *************************", data._id);
  console.log("data *************************", data);

  res.send({
    message: "success",
    status: 201,
    data: data,
  });
});

const updateData = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    let data = await saleModel.findById(req.params.id);

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
    let updateData = await saleModel.findByIdAndUpdate(req.params.id, newData, {
      new: true,
      runValidators: true,
      useFindAndModified: false,
    });

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
  let data = await saleModel.findById(req.params.id);
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
