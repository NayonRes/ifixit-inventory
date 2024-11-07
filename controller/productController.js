const productModel = require("../db/models/productModel");
const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");

const getAll = catchAsyncError(async (req, res, next) => {
  const data = await productModel.find();
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getDataByProductIds = catchAsyncError(async (req, res, next) => {
  console.log("req.body 111111111111111", req.body);
  let productIds = req.body.productIds;
  console.log("productIds", productIds);
  let data = [];
  if (productIds.length > 0) {
    data = await productModel.find({
      product_id: { $in: productIds },
    });
  }

  console.log("data", data);
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
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
    query.status = req.query.status;
  }

  if (req.query.sku) {
    query.sku = new RegExp(`^${req.query.sku}$`, "i");
  }
  if (req.query.category_id) {
    query.category_id = new RegExp(`^${req.query.category_id}$`, "i");
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
  let totalData = await productModel.countDocuments(query);
  console.log("totalData=================================", totalData);

  // -------------------------start-------------------------------------------
  const data = await productModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "category_id",
        as: "category_data",
      },
    },
    {
      $lookup: {
        from: "filters",
        localField: "filter_id",
        foreignField: "filter_id",
        as: "filter_data",
      },
    },

    {
      $project: {
        _id: 1,
        product_id: 1,
        name: 1,
        description: 1,
        price: 1,
        discount_price: 1,
        rating: 1,
        viewed: 1,
        stock_unit: 1,
        sku: 1,
        images: 1,
        filter_id: 1,
        store_id: 1,
        category_id: 1,
        location_id: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "category_data._id": 1,
        "category_data.name": 1,
        "category_data.category_id": 1,
        "filter_data._id": 1,
        "filter_data.parent_name": 1,
        "filter_data.name": 1,
        "filter_data.filter_id": 1,
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
  // -------------------------end-------------------------------------------
  // const data = await productModel.find(query).skip(startIndex).limit(limit);
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
  let data = await productModel.findById(req.params.id);
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
    imageData = await imageUpload(req.files.images, "products", next);
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
      imageData = await imageUpload(req.files.images, "products", next);
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
const patchData = async (req, res, next) => {
  console.log("patchData function is working");
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
  getAll,
  getDataByProductIds,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  patchData,
  deleteData,
};
