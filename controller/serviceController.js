const serviceModel = require("../db/models/serviceModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
// const fs = require('fs');
// const path = require('path');

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  var query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.device_id) {
    query.device_id = new RegExp(`^${req.query.device_id}$`, "i");
  }
  if (req.query.brand_id) {
    query.brand_id = new RegExp(`^${req.query.brand_id}$`, "i");
  }
  if (req.query.branch_id) {
    query.branch_id = new RegExp(`^${req.query.branch_id}$`, "i");
  }
  if (req.query.customer_id) {
    query.customer_id = new RegExp(`^${req.query.customer_id}$`, "i");
  }
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
  let totalData = await serviceModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  //const data = await serviceModel.find(query).skip(startIndex).limit(limit);


  const data = await serviceModel.aggregate([
    {
      $match: query,
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
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },

    {
      $project: {
        _id: 1,
        device_id: 1,
        model_id: 1,
        branch_id: 1,
        brand_id: 1,
        customer_id: 1,
        repair_by: 1,
        steps: 1,
        repair_info: 1,

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
        "customer_data.name": 1,
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

  const id = req.params.id;
  const data = await serviceModel.aggregate([
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
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_data",
      },
    },

    {
      $project: {
        _id: 1,
        device_id: 1,
        model_id: 1,
        branch_id: 1,
        brand_id: 1,
        customer_id: 1,
        repair_by: 1,
        steps: 1,
        repair_info: 1,

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
        "branch_data.image": 1,
        "customer_data.name": 1,
      },
    }
    
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;


  let stepsImageData = [];
  let repairImageData = [];

  console.log("body========",req.body);

      console.log("base  ---",req.body.steps[0].image);
  if (req.body.steps) {
    if (req.body.steps[0].image) {
      const stepImg = await base64ToImage(req.body.steps[0].image,"service");
      console.log("step immmg  --",stepImg)
      stepsImageData = await imageUpload(stepImg, "step", next);
      console.log("stepsImageData ||||||||||||||",stepsImageData);
    }

    if (req.body.repair_info.image) {
      repairImageData = await imageUpload(req.body.repair_info.image, "repair", next);
    }
  }

  let steps = req.body.steps.map((step, index) => ({
    ...step,
    image: stepsImageData[index] ? {
      public_id: stepsImageData[index].public_id,
      url: stepsImageData[index].url
    } : null
  }));

  let repairInfo = req.body.repair_info.map((repair, index) => ({
    ...repair,
    image: repairImageData[index] ? {
      public_id: repairImageData[index].public_id,
      url: repairImageData[index].url
    } : null
  }));
  console.log("repairInfo Img data new======",repairImageData);
  console.log("repairInfo new",repairInfo);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    steps,
    repair_info: repairInfo,
    created_by: decodedData?.user?.email,
  };

  const data = await serviceModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const fs = require('fs');
const path = require('path');

async function base64ToImage(base64String, outputPath) {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Invalid outputPath: The "outputPath" must be a valid string.');
  }

  // Remove the base64 data URI prefix if present (e.g., 'data:image/png;base64,')
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

  // Convert the base64 string to a buffer
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    // Ensure the directory exists (optional)
    const directoryPath = path.dirname(outputPath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Write the buffer to a file asynchronously
    await fs.promises.writeFile(outputPath, buffer);
    console.log(`Image saved to ${outputPath}`);

    // Return the output path or any other result you want to track
    return outputPath; // You can return the file path, image name, or success message here
  } catch (error) {
    console.error('Error saving the image:', error);
    throw error; // Propagate the error
  }
}


const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await serviceModel.findById(req.params.id);
  let oldParentName = data.name;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let stepsImageData = [];
  let repairImageData = [];
  let newData = req.body;

  // Handle updating steps image
  if (req.files && req.files.steps?.image) {
    stepsImageData = await imageUpload(req.files.steps.image, "service_step", next);
  }

  if (stepsImageData.length > 0) {
    newData.steps = newData.steps.map((step, index) => ({
      ...step,
      image: {
        public_id: stepsImageData[index]?.public_id,
        url: stepsImageData[index]?.url
      }
    }));
  }

  // Handle updating repair_info image
  if (req.files && req.files.repair_info?.image) {
    repairImageData = await imageUpload(req.files.repair_info.image, "service_repair", next);
  }

  if (repairImageData.length > 0) {
    newData.repair_info = newData.repair_info.map((repair, index) => ({
      ...repair,
      image: {
        public_id: repairImageData[index]?.public_id,
        url: repairImageData[index]?.url
      }
    }));
  }

  // Handle deleting old images
  if (data.steps && data.steps.length > 0) {
    for (let step of data.steps) {
      if (step.image?.public_id) {
        console.log("Deleting old step image");
        await imageDelete(step.image.public_id, next);
      }
    }
  }

  if (data.repair_info && data.repair_info.length > 0) {
    for (let repair of data.repair_info) {
      if (repair.image?.public_id) {
        console.log("Deleting old repair_info image");
        await imageDelete(repair.image.public_id, next);
      }
    }
  }


  newData = {
    ...newData,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  console.log("newData", newData);

  data = await serviceModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  const childrenParentUpdate = await serviceModel.updateMany(
    { parent_name: oldParentName },
    { $set: { parent_name: name } }
  );
  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    childrenParentUpdate,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await serviceModel.findById(req.params.id);
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
