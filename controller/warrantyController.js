const warrantyModel = require("../db/models/warrantyModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 1000;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
 
  if (req.query.repair_id) {
    query.repair_id = new mongoose.Types.ObjectId(req.query.repair_id);
  }

 
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  let totalData = await warrantyModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await warrantyModel
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
  const id = req.params.id;
  const data = await warrantyModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product_data",
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

        "product_data.name": 1,
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
  console.log("warranty createData ****************************");

  const { token } = req.cookies;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const repair_id = mongoose.Types.ObjectId(req.body.repair_id);

  let existingWarranty = await warrantyModel.findOne({ repair_id });
  console.log("existingWarranty", existingWarranty);

  if (!existingWarranty) {
    const newDocument = {
      ...req.body,
      created_by: decodedData?.user?.email,
    };

    let data = await warrantyModel.create(newDocument);
    res.send({ message: "success", status: 201, data: data });
  } else {
    let data = await warrantyModel.findByIdAndUpdate(
      existingWarranty._id,
      {
        $set: {
          ...req.body,
          updated_by: decodedData?.user?.email,
          updated_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModified: false, // should be useFindAndModify
      }
    );

    res.send({ message: "success", status: 201, data: data });
  }
});

// Note : this function is for only one sku update status of repair attached spareparts inactive and adjust stock counter collection

module.exports = {
  getDataWithPagination,

  getById,
  createData,
};
