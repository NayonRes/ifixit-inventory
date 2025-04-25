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
  const id = req.params.id;
  const data = await blogModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
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
      $lookup: {
        from: "models",
        localField: "model_id",
        foreignField: "_id",
        as: "model_data",
      },
    },
    // {
    //   $lookup: {
    //     from: "customers",
    //     localField: "customer_id",
    //     foreignField: "_id",
    //     as: "customer_data",
    //   },
    // },
    {
      $project: {
        _id: 1,
        title: 1,
        image: 1,
        device_id: 1,
        model_id: 1,
        branch_id: 1,
        brand_id: 1,
        //customer_id: 1,
        description: 1,
        repair_by: 1,
        steps: 1,
        body_info: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "device_data.name": 1,
        "device_data.image": 1,
        "model_data.name": 1,
        "model_data.image": 1,
        "brand_data.name": 1,
        "branch_data.name": 1,
        "branch_data._id": 1,
        "branch_data.is_main_branch": 1,
        "branch_data.address": 1,
        //"customer_data.name": 1,
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
  console.log("req?.image", req?.body?.image);

  let imageData = [];
  if (req?.body?.image) {
    imageData = await base64ImageUpload(req?.body?.image, "blog", next);
  }

  const updatedRepairInfo = await Promise.all(
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

  console.log("Updated body_info with images:", updatedRepairInfo);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    image: imageData[0],

    body_info: updatedRepairInfo,
    created_by: decodedData?.user?.email,
  };

  const data = await blogModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await blogModel.findById(req.params.id);
  let oldParentName = data.name;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const updatedRepairInfo = await Promise.all(
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

  console.log("Updated body_info with images:", updatedRepairInfo);

  let newData = {
    ...req.body,

    body_info: updatedRepairInfo,
    updated_by: decodedData?.user?.email,
  };

  if (data.steps && data.steps.length > 0) {
    for (let step of data.steps) {
      if (step.step_image?.public_id) {
        console.log("Deleting old step image");
        await imageDelete(step.step_image.public_id, next);
      }
    }
  }

  // if (data.body_info && data.body_info.length > 0) {
  //   for (let repair of data.body_info) {
  //     if (repair.image?.public_id) {
  //       console.log("Deleting old body_info image");
  //       await imageDelete(repair.image.public_id, next);
  //     }
  //   }
  // }

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
