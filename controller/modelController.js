const modelModel = require("../db/models/modelModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const getDeviceWiseModelDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown====================================================",
    req.query
  );

  var query = {};
  if (req.query.deviceId) {
    query.device_id = new mongoose.Types.ObjectId(req.query.deviceId);
  }
  console.log("query", query);

  // const data = await modelModel.find(query, "name model_id").lean();
  const data = await modelModel.find(query, { name: 1, model_id: 1 }).lean();

  console.log("device wise model list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await modelModel.find().lean();
  const data = await modelModel.find({}, "name model_id").lean();

  console.log("model list----------------", data);

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
  var query = {};
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }
  let totalData = await modelModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await modelModel.find(query).skip(startIndex).limit(limit);
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
  let data = await modelModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const getByDeviceId = catchAsyncError(async (req, res, next) => {
  let data = await modelModel
    .find({
      device_id: req.query.device_id,
    })
    .select("_id name image");

  if (!data) {
    return res.status(404).send({ message: "No data found" });
  }

  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  let newIdserial;
  let newIdNo;
  let newId;
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const lastDoc = await modelModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].model_id.slice(0, 1);
    newIdNo = parseInt(lastDoc[0].model_id.slice(1)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "m100";
  }

  let imageData = {};
  if (req.files) {
    imageData = await imageUpload(req.files.image, "model", next);
  }
  console.log("imageData", imageData);
  let newData = {
    ...req.body,
    model_id: newId,
    image: imageData[0],
    created_by: decodedData?.user?.email,
  };

  const data = await modelModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await modelModel.findById(req.params.id);
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }

  let oldParentName = data.name;
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let imageData = {};
  let newData = req.body;

  console.log("body======", newData);
  if (req.files) {
    imageData = await imageUpload(req.files.image, "model", next);
  }
  console.log("image data =========", imageData);
  if (imageData.length > 0) {
    newData = { ...req.body, image: imageData[0] };
  }
  if (data.image.public_id) {
    console.log("previous model image delete 111111");

    await imageDelete(data.image.public_id, next);
  }

  newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  data = await modelModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  const childrenParentUpdate = await modelModel.updateMany(
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
  let data = await modelModel.findById(req.params.id);
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

async function getAllLeafNodes(data) {
  console.log("getAllLeafNodes", data);
  let parents = await modelModel.find({
    name: { $ne: "Primary" },
    parent_name: new RegExp(`^${data.name}$`, "i"),
  });
  // parents = parents.filter((e) => e.name !== "Primary");
  console.log("11111111111", parents);
  if (parents.length < 1) {
    // If the parent has no children, it is a leaf node.
    console.log("data._id", data._id);
    return [data];
  }

  const childPromises = parents.map((item) => getAllLeafNodes(item));
  const childNodes = await Promise.all(childPromises);

  // Use the spread operator to flatten the array of arrays into a single array.
  return [...childNodes.flat()];
}

const getLeafModelList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafModelList");
  const leafNodes2 = await modelModel.aggregate([
    // { $match: { parent_name: "Mobile" } },
    {
      $lookup: {
        from: "categories",
        localField: "name",
        foreignField: "parent_name",
        as: "children",
      },
    },
    {
      $addFields: {
        isLeaf: { $eq: ["$children", []] },
      },
    },
    { $match: { isLeaf: true } },
    { $project: { _id: 1, name: 1, parent_name: 1, model_id: 1 } },
  ]);

  // res.json(leafNodes2);

  res.status(200).json({
    success: true,
    message: "successful",
    data: leafNodes2,
  });
});
const getModelWiseFilterList = catchAsyncError(async (req, res, next) => {
  console.log("req.body 3213231", req.body);

  const leafNodes = await getAllLeafNodes(req.body);

  console.log("leafNodes", leafNodes.toString());

  const stringIds = [];
  leafNodes.map((res) => {
    stringIds.push(res.model_id.toString());
  });

  console.log("stringIds", stringIds);
  // const stringIds = leafNodes.map((id) => id.toString());
  console.log(stringIds);
  const data = await filterModel
    .find(
      {
        model_id: {
          $in: stringIds,
        },
      },
      "name parent_name filter_id"
    )
    .lean()
    .sort({ parent_name: 1 });

  let result = [];

  data.map((p) => {
    // filterValues.some((e) => e.filter_name === p.parent_name);
    if (!result.some((e) => e.filter_name === p.parent_name)) {
      let filterDataByParentName = data.filter(
        (res) => res.parent_name === p.parent_name
      );
      result.push({
        filter_name: p.parent_name,
        filter_values: filterDataByParentName,
      });
    }
  });
  console.log("result", result);
  res.status(200).json({
    success: true,
    message: "successful",
    data: result,
  });
});
module.exports = {
  getDeviceWiseModelDropdown,
  getParentDropdown,
  getLeafModelList,
  getDataWithPagination,
  getById,
  getByDeviceId,
  createData,
  updateData,
  deleteData,
  getModelWiseFilterList,
};
