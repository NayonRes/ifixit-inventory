const blogModel = require("../db/models/blogModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const fs = require("fs");
const path = require("path");
const base64ImageUpload = require("../utils/base64ImageUpload");
const formatDate = require("../utils/formatDate");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  var query = {};

  if (req.query.status) {
    query.status = req.query.status === "true";
  }

  // if (req.query.customer_id) {
  //   query.customer_id = new RegExp(`^${req.query.customer_id}$`, "i");
  // }
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
  let totalData = await blogModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  //const data = await blogModel.find(query).skip(startIndex).limit(limit);

  const data = await blogModel.find(query).skip(startIndex).limit(limit);

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
  let data = await blogModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  console.log("req?.image", req?.body?.image);

  let imageData = [];
  if (req?.body?.image) {
    imageData = await base64ImageUpload(req?.body?.image, "blog", next);
  }

  const updatedBlogBodyInfo = await Promise.all(
    req.body.body_info?.map(async (item) => {
      console.log("item", item);

      if (item?.image) {
        const uploadData = await base64ImageUpload(item?.image, "blog", next);

        console.log("uploadData", uploadData);

        return {
          ...item,
          image: uploadData[0],
        };
      } else {
        return item;
      }
    })
  );

  console.log("Updated body_info with images:", updatedBlogBodyInfo);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    image: imageData[0],

    body_info: updatedBlogBodyInfo,
    created_by: decodedData?.user?.email,
  };

  const data = await blogModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await blogModel.findById(req.params.id);

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const updatedBlogBodyInfo = await Promise.all(
    req.body.body_info?.map(async (item, index) => {
      console.log("item", item);

      if (item?.image?.length > 0) {
        const uploadData = await base64ImageUpload(item?.image, "blog", next);
        console.log("uploadData", uploadData);

        return {
          ...item,
          image: uploadData[0],
        };
      } else {
        return item;
      }
    })
  );

  console.log("Updated body_info with images:", updatedBlogBodyInfo);

  let newData = {
    ...req.body,

    body_info: updatedBlogBodyInfo,
    updated_by: decodedData?.user?.email,
  };

  let imageData = [];

  console.log("body======", newData);
  if (req?.body?.image && req?.body?.image?.length > 0) {
    imageData = await base64ImageUpload(req?.body?.image, "blog", next);
  }
  console.log("image data =========", imageData);
  if (imageData.length > 0) {
    newData.image = imageData[0];
  }
  if (data.image.public_id) {
    console.log("previous model image delete 111111");

    await imageDelete(data.image.public_id, next);
  }
  newData = {
    ...newData,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  console.log("newData", newData);

  data = await blogModel.findByIdAndUpdate(req.params.id, newData, {
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
  let data = await blogModel.findById(req.params.id);
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
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
