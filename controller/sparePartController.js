const sparePartModel = require("../db/models/sparePartModel");
const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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
    query.status = req.query.status;
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

  let totalData = await sparePartModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await sparePartModel.find(query).skip(startIndex).limit(limit);

  const data = await sparePartModel.aggregate([
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
        from: "sparepartvariations",
        localField: "_id",
        foreignField: "spare_part_id",
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
        sparePart_id: 1,
        warranty: 1,
        price: 1,
        images: 1,
        description: 1,
        remarks: 1,

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

  let totalData = await sparePartModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await sparePartModel
    .find(query)
    .select("_id sparePart_id name price images")
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

  const data = await sparePartModel.aggregate([
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
        from: "sparepartvariations",
        localField: "_id",
        foreignField: "spare_part_id",
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
        sparePart_id: 1,
        warranty: 1,
        price: 1,
        images: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "category_data.name": 1,
        "brand_data.name": 1,
        "device_data.name": 1,
        "model_data.name": 1,
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
    imageData = await imageUpload(req.files.images, "spareParts", next);
  }
  console.log("imageData", imageData);

  let newIdserial;
  let newIdNo;
  let newId;
  const lastDoc = await sparePartModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].sparePart_id.slice(0, 2);
    newIdNo = parseInt(lastDoc[0].sparePart_id.slice(2)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "sp100";
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    images: imageData,
    sparePart_id: newId,
    created_by: decodedData?.user?.email,
  };
  console.log("newData", newData);
  const data = await sparePartModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
  console.log("asdasdfasdfasdfasdfs====================updateData");

  try {
    const { token } = req.cookies;
    let data = await sparePartModel.findById(req.params.id);

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
      imageData = await imageUpload(req.files.images, "spareParts", next);
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
    let updateData = await sparePartModel.findByIdAndUpdate(
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
  let data = await sparePartModel.findById(req.params.id);
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
  getDataWithPagination,
  lightSearchWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
