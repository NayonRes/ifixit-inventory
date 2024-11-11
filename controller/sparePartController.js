const sparePartModel = require("../db/models/sparePartModel");
const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");


const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status;
  }

  let totalData = await sparePartModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await sparePartModel.find(query).skip(startIndex).limit(limit);
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
  let data = await sparePartModel.findById(req.params.id);
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
      imageData = await imageUpload(req.files.images, "sparePart", next);
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
    getById,
    createData,
    updateData,
    deleteData,
  };