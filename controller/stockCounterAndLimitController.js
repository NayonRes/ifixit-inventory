const stockCounterAndLimitModel = require("../db/models/stockCounterAndLimitModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const counterModel = require("../db/models/counterModel");

const getBrnachLimit = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};

  if (req.query.product_variation_id) {
    query.product_variation_id = new mongoose.Types.ObjectId(
      req.query.product_variation_id
    );
  }

  const totalData = await stockCounterAndLimitModel.countDocuments(query);
  // let totalData = await stockCounterAndLimitModel.countDocuments(query);

  console.log("totalData=================================", totalData);
  //const data = await stockCounterAndLimitModel.find(query).skip(startIndex).limit(limit);

  const data = await stockCounterAndLimitModel
    .find(query)
    .sort({ created_at: -1 })
    .skip(startIndex)
    .limit(limit);
  console.log("data", data);
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
    totalData: totalData?.length > 0 ? totalData[0]?.total : 0,
    pageNo: page,
    limit: limit,
  });
});
const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};

  if (req.query.product_id) {
    query.product_id = new mongoose.Types.ObjectId(req.query.product_id);
  }
  if (req.query.product_variation_id) {
    query.product_variation_id = new mongoose.Types.ObjectId(
      req.query.product_variation_id
    );
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }

  // let totalData = await stockCounterAndLimitModel.countDocuments(query);
  let totalData = await stockCounterAndLimitModel.aggregate([
    {
      $match: query, // Apply the basic filters from the query object
    },
    {
      $match: {
        $expr: {
          $gt: ["$stock_limit", "$total_stock"], // Additional condition
        },
      },
    },
    {
      $count: "total", // Count the documents that match the conditions
    },
  ]);
  console.log("totalData=================================", totalData);
  //const data = await stockCounterAndLimitModel.find(query).skip(startIndex).limit(limit);

  const data = await stockCounterAndLimitModel.aggregate([
    {
      $match: query,
    },
    {
      $match: {
        $expr: {
          $gt: ["$stock_limit", "$total_stock"],
        },
      },
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
        as: "spare_parts_variation_data",
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
        product_id: 1,
        product_variation_id: 1,
        branch_id: 1,
        stock_limit: 1,
        total_stock: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "product_data.name": 1,
        "product_data.description": 1,
        "product_data.description": 1,
        "product_data.price": 1,
        "branch_data.name": 1,
        "branch_data.parent_name": 1,
        "spare_parts_variation_data.name": 1,
        "spare_parts_variation_data.price": 1,
        "spare_parts_variation_data.images": 1,
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
    totalData: totalData?.length > 0 ? totalData[0]?.total : 0,
    pageNo: page,
    limit: limit,
  });
});
const getById = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await stockCounterAndLimitModel.aggregate([
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
        as: "spare_parts_variation_data",
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
        product_id: 1,
        stock_limit: 1,
        total_stock: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "product_data.name": 1,
        "product_data.description": 1,
        "product_data.description": 1,
        "product_data.price": 1,
        "branch_data.name": 1,
        "branch_data.parent_name": 1,
        "spare_parts_variation_data.name": 1,
        "spare_parts_variation_data.price": 1,
        "spare_parts_variation_data.images": 1,
      },
    },
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createLimit = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const stock_limit = req.body.stock_limit ? parseInt(req.body.stock_limit) : 0;
  const branch_id = req.body.branch_id;
  const product_variation_id = req.body.product_variation_id;
  //   const total_stock = req.body.total_stock;
  const product_id = req.body.product_id;

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let existingStock = await stockCounterAndLimitModel.findOne({
    branch_id,
    product_variation_id,
  });
  console.log("existingStock", existingStock);

  if (!existingStock) {
    const newDocument = {
      branch_id: branch_id,
      product_variation_id: product_variation_id,
      product_id: product_id,
      stock_limit: stock_limit,
      created_by: decodedData?.user?.email,
    };

    let data = await stockCounterAndLimitModel.create(newDocument);
    res.send({ message: "success", status: 201, data: data });
  } else {
    let data = await stockCounterAndLimitModel.findByIdAndUpdate(
      existingStock._id,
      {
        $set: {
          stock_limit: stock_limit,
          updated_by: decodedData?.user?.email,
          updated_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModified: false,
      }
    );
    res.send({ message: "success", status: 201, data: data });
  }
});
const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const stock_limit = parseInt(req.body.stock_limit);
  const branch_id = req.body.branch_id;
  const product_variation_id = req.body.product_variation_id;
  const total_stock = req.body.total_stock;
  const product_id = req.body.product_id;

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const existingStock = await stockCounterAndLimitModel.findOne({
    branch_id,
    product_variation_id,
  });

  if (!existingStock) {
    const newDocument = {
      branch_id: branch_id,
      product_variation_id: product_variation_id,
      product_id: product_id,
      total_stock: total_stock,
      stock_limit: stock_limit,
      created_by: decodedData?.user?.email,
    };

    await stockCounterAndLimitModel.create([newDocument]);
    res.send({ message: "success", status: 201, data: data });
  } else {
    const data = await stockCounterAndLimitModel.findByIdAndUpdate(
      existingStock._id,
      {
        $set: {
          stock_limit: existingStock.stock_limit,
          updated_by: decodedData?.user?.email,
          updated_at: new Date(),
        },
        $inc: {
          total_stock: total_stock,
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModified: false,
      }
    );
    res.send({ message: "success", status: 201, data: data });
  }
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const stock_limit = parseInt(req.body.stock_limit);
  const total_stock = parseInt(req.body.total_stock);
  const branch_id = req.body.branch_id;
  const product_variation_id = req.body.product_variation_id;
  const existingStock = await stockCounterAndLimitModel.findOne({
    branch_id,
    product_variation_id,
  });

  if (!existingStock) {
    return res.status(404).send({ message: "stock not found", status: 404 });
  }

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const data = await stockCounterAndLimitModel.findByIdAndUpdate(
    existingStock._id,
    {
      $set: {
        stock_limit: stock_limit,
        updated_by: decodedData?.user?.email,
        updated_at: new Date(),
      },
      $inc: {
        total_stock: total_stock,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModified: false,
    }
  );
  res.send({ message: "success", status: 201, data: data });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await stockCounterAndLimitModel.findById(req.params.id);
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

async function incrementStock(branch_id, product_variation_id, stock, session) {
  const stockCounterAndLimit = parseInt(stock);
  try {
    const existingStock = await stockCounterAndLimitModel
      .findOne({
        branch_id,
        product_variation_id,
      })
      .session(session);

    if (existingStock) {
      await stockCounterAndLimitModel.findByIdAndUpdate(
        { _id: mongoose.Types.ObjectId(existingStock._id) },
        { $inc: { total_stock: stockCounterAndLimit } },
        { upsert: false, new: true, session }
      );
      console.log(
        `Total stock for ${branch_id}, ${product_variation_id}, ${existingStock._id} has been incremented.`
      );
    } else {
      console.log(
        `No document found for ${branch_id}, ${product_variation_id}. No update performed.`
      );
    }
  } catch (err) {
    console.error("Error updating stock:", err);
  }
}

async function decrementStock(branch_id, product_variation_id, stock, session) {
  try {
    const existingStock = await stockCounterAndLimitModel
      .findOne({
        branch_id,
        product_variation_id,
      })
      .session(session);

    if (existingStock) {
      await stockCounterAndLimitModel.updateOne(
        { _id: existingStock._id },
        { $inc: { total_stock: -stock } },
        { session }
      );
      console.log(
        `Total stock for ${branch_id}, ${product_variation_id} has been incremented.`
      );
    } else {
      console.log(
        `No document found for ${branch_id}, ${product_variation_id}. No update performed.`
      );
    }
  } catch (err) {
    console.error("Error updating stock:", err);
  }
}

module.exports = {
  getDataWithPagination,
  getById,
  createData,
  createLimit,
  updateData,
  deleteData,
  incrementStock,
  decrementStock,
  getBrnachLimit,
};
