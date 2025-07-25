const productVariationModel = require("../db/models/productVariationModel");
const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const branchModel = require("../db/models/branchModel");
const formatDate = require("../utils/formatDate");
const lightSearchWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  var query = {};
  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }

  let totalData = await productVariationModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await productVariationModel
    .find(query)
    .select("_id name price base_price images")
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
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const branchStock = catchAsyncError(async (req, res, next) => {
  // Retrieve all branches

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  // ai table nai  branch_id
  // if (req.query.branch_id) {
  //   query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  // }
  if (req.query.product_id) {
    query.product_id = new mongoose.Types.ObjectId(req.query.product_id);
  }
  if (req.query.product_variation_id) {
    query._id = new mongoose.Types.ObjectId(req.query.product_variation_id);
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  const totalData = await productVariationModel.countDocuments(query);

  const data = await productVariationModel.aggregate([
    { $match: query },

    // Lookup product data
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product_data",
      },
    },

    // Lookup stock data from stock_counter_and_limits
    {
      $lookup: {
        from: "stock_counter_and_limits",
        let: {
          variationId: "$_id",
          branchId: new mongoose.Types.ObjectId(req.query.branch_id),
        }, // Store product_variation_id and branch_id
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$product_variation_id", "$$variationId"] }, // Match variation ID
                  { $eq: ["$branch_id", "$$branchId"] },
                ],
              },
            },
          },
        ],
        as: "stock_data",
      },
    },

    // Structure stock data per branch

    // Final projection
    {
      $project: {
        _id: 1,
        name: 1,
        quality: 1,
        price: 1,
        base_price: 1,
        image: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "product_data._id": 1,
        "product_data.name": 1,
        stock_data: 1, // Include structured stock data per branch
      },
    },

    // Pagination
    { $skip: startIndex },
    { $limit: limit },
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
const allBranchStock = catchAsyncError(async (req, res, next) => {
  // Retrieve all branches
  const branchList = await branchModel.find({}, "name _id").lean();
  const allBranches = branchList.map((b) => new ObjectId(b._id)); // Convert to ObjectId

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  // ai table nai  branch_id
  // if (req.query.branch_id) {
  //   query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  // }
  if (req.query.product_id) {
    query.product_id = new mongoose.Types.ObjectId(req.query.product_id);
  }
  if (req.query.product_variation_id) {
    query._id = new mongoose.Types.ObjectId(req.query.product_variation_id);
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  const totalData = await productVariationModel.countDocuments(query);

  const data = await productVariationModel.aggregate([
    { $match: query },

    // Lookup product data
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product_data",
      },
    },

    // Lookup stock data from stock_counter_and_limits
    {
      $lookup: {
        from: "stock_counter_and_limits",
        let: { variationId: "$_id" }, // Store product_variation_id
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$product_variation_id", "$$variationId"], // Match variation ID
              },
            },
          },
        ],
        as: "stock_data",
      },
    },

    // Structure stock data per branch
    {
      $addFields: {
        stock_data: {
          $map: {
            input: allBranches, // Loop through all branches
            as: "branch",
            in: {
              branch_id: "$$branch", // Assign branch ID
              stock: {
                //   $filter: {
                //     input: "$stock_data", // Filter the joined stock data
                //     as: "stock",
                //     cond: {
                //       $eq: ["$$stock.branch_id", "$$branch"],
                //     }, // Match branch_id
                //   },

                $filter: {
                  input: "$stock_data", // Filter the joined stock data
                  as: "stock",
                  cond: {
                    $and: [
                      { $eq: ["$$stock.branch_id", "$$branch"] }, // Match branch_id
                      { $eq: ["$$stock.product_variation_id", "$_id"] }, // Match product_variation_id
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },

    // Final projection
    {
      $project: {
        _id: 1,
        name: 1,
        quality: 1,
        price: 1,
        base_price: 1,
        image: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "product_data._id": 1,
        "product_data.name": 1,
        stock_data: 1, // Include structured stock data per branch
      },
    },

    // Pagination
    { $skip: startIndex },
    { $limit: limit },
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

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  let totalData = await productVariationModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await productVariationModel
  //   .find(query)
  //   .skip(startIndex)
  //   .limit(limit);

  const data = await productVariationModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product_data",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        quality: 1,
        price: 1,
        base_price: 1,

        image: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "product_data._id": 1,
        "product_data.name": 1,
      },
    },
    // { $unwind: "$role" }, // Unwind the array if you expect only one related role per user
    // { $sort: { created_at: -1 } },
    { $skip: startIndex },
    { $limit: limit },
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
  let data = await productVariationModel.findById(req.params.id);
  if (!data) {
    return next(new ErrorHander("No data found", 404));
  }
  res.status(200).json({
    success: true,
    message: "success",
    data: data,
  });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("req.files", req.files);
  console.log("req.body", req.body);
  const { token } = req.cookies;
  let imageData = [];
  if (req.files) {
    imageData = await imageUpload(req.files.image, "product", next);
  }
  console.log("imageData", imageData);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    images: imageData,
    created_by: decodedData?.user?.email,
  };
  console.log("newData", newData);
  const data = await productVariationModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    let data = await productVariationModel.findById(req.params.id);

    if (!data) {
      console.log("if");
      return next(new ErrorHander("No data found", 404));
    }

    // deleting previous images
    if (req.files && data.images.length > 0) {
      for (let index = 0; index < data.images.length; index++) {
        const element = data.images[index];
        await imageDelete(element.public_id, next);
      }
    }
    //uploading new images
    let imageData = [];
    let newData = req.body;
    if (req.files) {
      imageData = await imageUpload(req.files.images, "product", next);
    }
    console.log("imageData", imageData);
    if (imageData.length > 0) {
      newData = { ...req.body, images: imageData };
    }
    let decodedData = jwt.verify(token, process.env.JWT_SECRET);

    newData = {
      ...newData,
      updated_by: decodedData?.user?.email,
      updated_at: new Date(),
    };
    console.log("newData", newData);
    let updateData = await productVariationModel.findByIdAndUpdate(
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
  console.log("deleteData function is working");
  let data = await productVariationModel.findById(req.params.id);
  console.log("data", data.images);
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }

  if (data.images.length > 0) {
    for (let index = 0; index < data.images.length; index++) {
      const element = data.images[index];
      await imageDelete(element.public_id, next);
    }
  }
  await data.remove();
  res.status(200).json({
    success: true,
    message: "Delete successfully",
    data: data,
  });
});
module.exports = {
  lightSearchWithPagination,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  allBranchStock,
  branchStock,
};
