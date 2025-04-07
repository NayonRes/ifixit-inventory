const purchaseModel = require("../db/models/purchaseModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const purchaseProductModel = require("../db/models/purchaseProductModel");

const mongoose = require("mongoose");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await purchaseModel.find().lean();
  const data = await purchaseModel.find({}, "name purchase_id").lean();

  console.log("purchase list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query================", req.query);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};
  // if (req.query.name) {
  //   query.name = new RegExp(`^${req.query.name}$`, "i");
  // }

  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.supplier_id) {
    query.supplier_id = new mongoose.Types.ObjectId(req.query.supplier_id);
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.purchase_status) {
    query.purchase_status = req.query.purchase_status;
  }
  if (req.query.payment_status) {
    query.payment_status = req.query.payment_status;
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
  let totalData = await purchaseModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await purchaseModel.find(query).skip(startIndex).limit(limit);

  const data = await purchaseModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "supplier_id",
        foreignField: "_id",
        as: "supplier_data",
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
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_data",
      },
    },
    {
      $lookup: {
        from: "purchase_products",
        localField: "_id",
        foreignField: "purchase_id",
        as: "purchase_products_data",
      },
    },

    {
      $project: {
        _id: 1,
        purchase_id: 1,
        purchase_date: 1,
        supplier_id: 1,
        user_id: 1,
        branch_id: 1,
        purchase_status: 1,
        payment_status: 1,
        payment_method: 1,
        paid_amount: 1,
        shipping_charge: 1,
        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "supplier_data.name": 1,
        "supplier_data.mobile": 1,
        "branch_data.name": 1,
        "user_data.name": 1,
        purchase_products_data: 1,
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
  // let data = await purchaseModel.findById(req.params.id);

  const id = req.params.id;
  const data2 = await purchaseModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "supplier_id",
        foreignField: "_id",
        as: "supplier_data",
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
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_data",
      },
    },
    {
      $lookup: {
        from: "purchase_products",
        localField: "_id",
        foreignField: "purchase_id",
        as: "purchase_products_data",
      },
    },

    {
      $project: {
        _id: 1,
        purchase_id: 1,
        purchase_date: 1,
        supplier_id: 1,
        user_id: 1,
        branch_id: 1,
        purchase_status: 1,
        payment_method: 1,
        paid_amount: 1,
        payment_status: 1,
        shipping_charge: 1,
        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "supplier_data.name": 1,
        "supplier_data.mobile": 1,
        "branch_data.name": 1,
        "user_data.name": 1,
        purchase_products_data: 1,
      },
    },
  ]);

  const data = await purchaseModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "supplier_id",
        foreignField: "_id",
        as: "supplier_data",
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
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_data",
      },
    },
    {
      $lookup: {
        from: "purchase_products",
        localField: "_id",
        foreignField: "purchase_id",
        as: "purchase_products_data",
      },
    },
    // Lookup for product_variations
    {
      $unwind: {
        path: "$purchase_products_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "purchase_products_data.product_id",
        foreignField: "_id",
        as: "purchase_products_data.product_details",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "purchase_products_data.product_variation_id",
        foreignField: "_id",
        as: "purchase_products_data.product_variation_details",
      },
    },
    {
      $group: {
        _id: "$_id",
        purchase_id: { $first: "$purchase_id" },
        purchase_date: { $first: "$purchase_date" },
        supplier_id: { $first: "$supplier_id" },
        user_id: { $first: "$user_id" },
        branch_id: { $first: "$branch_id" },
        purchase_status: { $first: "$purchase_status" },
        payment_status: { $first: "$payment_status" },
        payment_method: { $first: "$payment_method" },
        paid_amount: { $first: "$paid_amount" },
        shipping_charge: { $first: "$shipping_charge" },
        remarks: { $first: "$remarks" },
        status: { $first: "$status" },
        created_by: { $first: "$created_by" },
        created_at: { $first: "$created_at" },
        updated_by: { $first: "$updated_by" },
        updated_at: { $first: "$updated_at" },
        supplier_data: { $first: "$supplier_data" },
        branch_data: { $first: "$branch_data" },
        user_data: { $first: "$user_data" },
        purchase_products_data: { $push: "$purchase_products_data" },
      },
    },
    {
      $project: {
        _id: 1,
        purchase_id: 1,
        purchase_date: 1,
        supplier_id: 1,
        user_id: 1,
        branch_id: 1,
        purchase_status: 1,
        payment_method: 1,
        paid_amount: 1,
        payment_status: 1,
        shipping_charge: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "supplier_data.name": 1,
        "supplier_data.mobile": 1,
        "branch_data.name": 1,
        "user_data.name": 1,
        purchase_products_data: 1,
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
  let newIdserial;
  let newIdNo;
  let newId;
  let selectedProducts = JSON.parse(req.body.selectedProducts);
  console.log(
    "req.body.selectedProducts",
    JSON.parse(req.body.selectedProducts)
  );

  const lastDoc = await purchaseModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].purchase_id.slice(0, 3);
    newIdNo = parseInt(lastDoc[0].purchase_id.slice(3)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "pur100";
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    purchase_id: newId,
    created_by: decodedData?.user?.email,
  };

  const data = await purchaseModel.create(newData);

  console.log("data", data);
  let selectedProductData;
  if (data) {
    let newSelectedProducts = [];
    for (let index = 0; index < selectedProducts.length; index++) {
      const element = selectedProducts[index];

      let newElement = {
        purchase_id: data?._id,
        product_id: element.product_id,
        product_variation_id: element.product_variation_id,
        quantity: element.quantity,
        unit_price: element.unit_price,
        purchase_product_status: element.purchase_product_status,
      };
      newSelectedProducts.push(newElement);
    }

    selectedProductData = await purchaseProductModel.insertMany(
      newSelectedProducts
    );
  }

  res.send({
    message: "success",
    status: 201,
    data: data,
    selectedProductData: selectedProductData,
  });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  let data = await purchaseModel.findById(req.params.id);
  console.log(data);
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  console.log(req.body);
  const newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  data = await purchaseModel.findByIdAndUpdate(req.params.id, newData, {
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
  let data = await purchaseModel.findById(req.params.id);
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
