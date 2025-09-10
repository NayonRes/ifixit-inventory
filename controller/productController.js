const productModel = require("../db/models/productModel");
const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const formatDate = require("../utils/formatDate");

const getDataWithBranchAvaiableProducts = catchAsyncError(
  async (req, res, next) => {
    console.log("===========req.query================", req.query);

    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    var query = {};
    // if (req.query.name) {
    //   query.name = new RegExp(`^${req.query.name}$`, "i");
    // }

    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.status) {
      query.status = req.query.status === "true";
    }

    if (req.query.category_id) {
      query.category_id = new mongoose.Types.ObjectId(req.query.category_id);
    }
    if (req.query.brand_id) {
      query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
    }
    if (req.query.device_id) {
      query.device_id = new mongoose.Types.ObjectId(req.query.device_id);
    }
    if (req.query.model_id) {
      query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
    }

    if (req.query.attachable_models) {
      query.attachable_models = {
        $in: [new mongoose.Types.ObjectId(req.query.attachable_models)],
      };
    }
    if (parseInt(minPrice) && parseInt(maxPrice)) {
      query.price = {
        $gte: parseInt(minPrice),
        $lte: parseInt(maxPrice),
      };
    } else if (parseInt(minPrice)) {
      query.price = {
        $gte: parseInt(minPrice),
      };
    } else if (parseInt(maxPrice)) {
      query.price = {
        $lte: parseInt(maxPrice),
      };
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

    let totalData = await productModel.countDocuments(query);
    console.log("totalData=================================", totalData);

    const data = await productModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_data",
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
          from: "devices",
          localField: "device_id",
          foreignField: "_id",
          as: "device_data",
        },
      },
      {
        $lookup: {
          from: "models",
          localField: "model_id",
          foreignField: "_id",
          as: "model_data",
        },
      },

      {
        $lookup: {
          from: "product_variations",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$product_id", "$$productId"] },
              },
            },
            {
              $lookup: {
                from: "stock_counter_and_limits",
                let: { variationId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$product_variation_id", "$$variationId"],
                      },
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
                  // 🔹 flatten branch_data if you want just a single object instead of an array
                  {
                    $unwind: {
                      path: "$branch_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: "stock_data",
              },
            },
          ],
          as: "variation_data",
        },
      },
      // 🔹 Regroup variations back into array
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          description: { $first: "$description" },
          brand_id: { $first: "$brand_id" },
          category_id: { $first: "$category_id" },
          device_id: { $first: "$device_id" },
          model_id: { $first: "$model_id" },
          product_id: { $first: "$product_id" },
          warranty: { $first: "$warranty" },
          price: { $first: "$price" },
          images: { $first: "$images" },
          remarks: { $first: "$remarks" },
          attachable_models: { $first: "$attachable_models" },
          status: { $first: "$status" },
          created_by: { $first: "$created_by" },
          created_at: { $first: "$created_at" },
          updated_by: { $first: "$updated_by" },
          updated_at: { $first: "$updated_at" },
          category_data: { $first: "$category_data" },
          brand_data: { $first: "$brand_data" },
          device_data: { $first: "$device_data" },
          model_data: { $first: "$model_data" },
          variation_data: { $push: "$variation_data" }, // with stock_data inside
        },
      },

      { $sort: { created_at: -1 } },
    ]);

    console.log("data", data);
    res.status(200).json({
      success: true,
      message: "successful",
      data: data,
      totalData: totalData,
    });
  }
);

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

  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  if (req.query.category_id) {
    query.category_id = new mongoose.Types.ObjectId(req.query.category_id);
  }
  if (req.query.brand_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.brand_id);
  }
  if (req.query.device_id) {
    query.device_id = new mongoose.Types.ObjectId(req.query.device_id);
  }
  if (req.query.model_id) {
    query.model_id = new mongoose.Types.ObjectId(req.query.model_id);
  }

  if (req.query.attachable_models) {
    query.attachable_models = {
      $in: [new mongoose.Types.ObjectId(req.query.attachable_models)],
    };
  }
  if (parseInt(minPrice) && parseInt(maxPrice)) {
    query.price = {
      $gte: parseInt(minPrice),
      $lte: parseInt(maxPrice),
    };
  } else if (parseInt(minPrice)) {
    query.price = {
      $gte: parseInt(minPrice),
    };
  } else if (parseInt(maxPrice)) {
    query.price = {
      $lte: parseInt(maxPrice),
    };
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

  let totalData = await productModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await productModel.find(query).skip(startIndex).limit(limit);

  const data = await productModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category_data",
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
        from: "devices",
        localField: "device_id",
        foreignField: "_id",
        as: "device_data",
      },
    },
    {
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "_id",
        foreignField: "product_id",
        as: "variation_data",
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        brand_id: 1,
        category_id: 1,
        device_id: 1,
        model_id: 1,
        product_id: 1,
        warranty: 1,
        price: 1,
        images: 1,
        description: 1,
        remarks: 1,
        attachable_models: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        // "category_data._id": 1,
        "category_data.name": 1,
        // "brand_data._id": 1,
        "brand_data.name": 1,
        "device_data.name": 1,
        "model_data.name": 1,
        variation_data: 1,
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

  let totalData = await productModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await productModel
    .find(query)
    .select("_id product_id name price images")
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

  const data = await productModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category_data",
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
        from: "devices",
        localField: "device_id",
        foreignField: "_id",
        as: "device_data",
      },
    },
    {
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },
    {
      $lookup: {
        from: "models",
        localField: "attachable_models",
        foreignField: "_id",
        as: "attachable_models_data",
      },
    },
    {
      $lookup: {
        from: "product_variations",
        localField: "_id",
        foreignField: "product_id",
        as: "variation_data",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        brand_id: 1,
        category_id: 1,
        device_id: 1,
        model_id: 1,
        product_id: 1,
        warranty: 1,
        price: 1,
        images: 1,
        remarks: 1,
        attachable_models: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "category_data.name": 1,
        "brand_data.name": 1,
        "device_data.name": 1,
        "model_data.name": 1,
        "attachable_models_data._id": 1,
        "attachable_models_data.name": 1,
        variation_data: 1,
      },
    },
  ]);

  if (!data || data.length === 0) {
    return next(new ErrorHander("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "success",
    data: data[0], // Access the first (and only) document in the array
  });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("req.files--------", req.files);
  console.log("req.body------------", req.body);

  const { token } = req.cookies;
  let imageData = [];
  if (req.files) {
    imageData = await imageUpload(req.files.images, "product", next);
  }
  console.log("imageData", imageData);

  let newIdserial;
  let newIdNo;
  let newId;
  const lastDoc = await productModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].product_id.slice(0, 1);
    newIdNo = parseInt(lastDoc[0].product_id.slice(1)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "p100";
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    images: imageData,
    product_id: newId,
    created_by: decodedData?.user?.email,
  };
  console.log("newData", newData);
  const data = await productModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
  console.log("asdasdfasdfasdfasdfs====================updateData");

  try {
    const { token } = req.cookies;
    let data = await productModel.findById(req.params.id);

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
    let updateData = await productModel.findByIdAndUpdate(
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
  let data = await productModel.findById(req.params.id);
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
  getDataWithBranchAvaiableProducts,
  getDataWithPagination,
  lightSearchWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
