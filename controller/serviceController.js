const serviceModel = require("../db/models/serviceModel");
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
    },
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  const updatedSteps = await Promise.all(
    req.body.steps?.map(async (step) => {
      console.log("step", step);

      if (step?.step_image) {
        const uploadData = await base64ImageUpload(
          step?.step_image,
          "service",
          next
        );

        console.log("uploadData", uploadData);

        return {
          ...step,
          step_image: uploadData[0],
        };
      } else {
        return step;
      }
    })
  );
  const updatedRepairInfo = await Promise.all(
    req.body.repair_info?.map(async (item) => {
      console.log("item", item);

      if (item?.repair_image) {
        const uploadData = await base64ImageUpload(
          item?.repair_image,
          "service",
          next
        );

        console.log("uploadData", uploadData);

        return {
          ...item,
          repair_image: uploadData[0],
        };
      } else {
        return item;
      }
    })
  );

  console.log("updatedSteps", updatedSteps);

  console.log("Updated steps with images:", updatedSteps);
  console.log("Updated repair_info with images:", updatedRepairInfo);

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    steps: updatedSteps,
    repair_info: updatedRepairInfo,
    created_by: decodedData?.user?.email,
  };

  const data = await serviceModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

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

  const stepImageData = await processImages(req.body.steps, "step_image");
  const repairImageData = await processImages(
    req.body.repair_info,
    "repair_image"
  );

  const updatedSteps = req.body.steps.map((step, index) => {
    const currentStepImage = stepImageData[index] && stepImageData[index][0];
    const existingStepImage = data.steps[index]?.step_image;

    return {
      ...step,
      step_image: currentStepImage
        ? {
            public_id: currentStepImage.public_id,
            url: currentStepImage.url,
          }
        : existingStepImage || null,
    };
  });
  const airInfo = req.body.repair_info.map((repair, index) => {
    const currentRepairImage =
      repairImageData[index] && repairImageData[index][0];
    const existingRepairImage = data.repair_info[index]?.repair_image;

    return {
      ...repair,
      repair_image: currentRepairImage
        ? {
            public_id: currentRepairImage.public_id,
            url: currentRepairImage.url,
          }
        : existingRepairImage || null,
    };
  });
  console.log("Updated steps with images:", updatedSteps);
  console.log("Updated repair_info with images:", updatedRepairInfo);

  let newData = {
    ...req.body,
    steps: updatedSteps,
    repair_info: updatedRepairInfo,
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

  if (data.repair_info && data.repair_info.length > 0) {
    for (let repair of data.repair_info) {
      if (repair.repair_image?.public_id) {
        console.log("Deleting old repair_info image");
        await imageDelete(repair.repair_image.public_id, next);
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

async function processImages(items, imageField) {
  const processedImageData = [];
  console.log("items ===-0", items);
  console.log("imageField ===-0", imageField);
  if (!items) {
    return;
  }
  for (let item of items) {
    if (item[imageField]) {
      console.log("item[imageField]", item[imageField]);
      // const decodedImage = await base64ToImage(item[imageField], "service");  // Adjust directory as needed
      // console.log(`${imageField} decoded --`, decodedImage);

      let decodedImage = await base64ToBuffer(item[imageField]);

      const uploadData = await imageUpload(decodedImage, imageField);
      processedImageData.push(uploadData);
    } else {
      processedImageData.push(null);
    }
  }

  return processedImageData;
}

function base64ToFileObject(base64Data, fileName) {
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Base64 image data");
  }

  const fileType = matches[1]; // Extract the file type (e.g., 'png', 'jpeg')
  const buffer = Buffer.from(matches[2], "base64");

  return {
    name: fileName,
    type: `image/${fileType}`,
    content: buffer,
  };
}
// function base64ToBuffer(base64Data) {
//   const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
//   if (!matches || matches.length !== 3) {
//     throw new Error("Invalid Base64 image data");
//   }

//   return Buffer.from(matches[2], "base64");
// }

async function base64ToImage(base64String) {
  if (!base64String || typeof base64String !== "string") {
    throw new Error("Base64 string is required");
  }

  // Extract the MIME type and Base64 data
  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Base64 string");
  }

  const mimeType = `image/${matches[1]}`; // Extract MIME type (e.g., "image/jpeg")
  const base64Data = matches[2]; // Extract Base64 data
  const buffer = Buffer.from(base64Data, "base64"); // Convert Base64 to Buffer

  // Generate a file name (optional)
  const fileName = `temp-${Date.now()}.${matches[1]}`; // Example: temp-1673291284.jpeg

  // Return the file-like object
  return {
    fileName, // Example: "temp-123456789.jpeg"
    mimeType, // Example: "image/jpeg"
    buffer, // File content as Buffer
  };
}
async function base64ToImage2(base64String, outputDirectory = "tmp") {
  if (!base64String || typeof base64String !== "string") {
    return next(new ErrorHander("Base64 string is required", 400));
  }

  const base64Data = base64String.split(",")[1]; // Get only the Base64 part

  if (!base64Data) {
    return next(new ErrorHander("Invalid Base64 string", 400));
  }

  const currentDirectory = __dirname; // This will return the current directory path

  // Generate a temporary file path using the current timestamp
  const fileName = `tmp-${Date.now()}.jpeg`; // You can adjust the file extension as needed
  const tempFilePath = path.join(currentDirectory, outputDirectory, fileName);

  // Ensure the output directory exists, if not create it
  const outputPath = path.join(currentDirectory, outputDirectory);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // Write the Base64 data to the file
  try {
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
    console.log(`Image saved successfully at ${tempFilePath}`);

    // Return an object with the file path as 'tempFilePath'
    return { tempFilePath }; // Return an object with 'tempFilePath' field
  } catch (error) {
    console.error("Error saving the image:", error);
    return next(new ErrorHander("Failed to save the image", 400));
  }
}

module.exports = {
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
