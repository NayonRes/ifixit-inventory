const deviceBrandModel = require("../db/models/deviceBrandModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const formatDate = require("../utils/formatDate");

const getListGroupByParent = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await deviceBrandModel.find().lean();

  const groupsList = await deviceBrandModel.aggregate([
    {
      $group: {
        _id: "$parent_name", // Group by parent_name
        items: { $push: "$$ROOT" }, // Collect the full document into an array
      },
    },
    {
      $project: {
        _id: 0, // Exclude _id from the output
        parent_name: "$_id",
        items: 1,
      },
    },
  ]);

  const data = await deviceBrandModel
    .find({}, "name device_brand_id parent_name")
    .lean();

  console.log("device list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: groupsList,
  });
});
const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await deviceBrandModel.find().lean();
  let query = {};
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }
  const data = await deviceBrandModel
    .find(query, "name device_brand_id parent_name")
    .sort({ order_no: -1 })
    .lean();

  console.log("device list----------------", data);

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
  let query = {
    // Exclude documents where name is "Primary"
  };

  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }
  if (req.query.order_no && !isNaN(req.query.order_no)) {
    query.order_no = parseInt(req.query.order_no);
  }
  let totalData = await deviceBrandModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await deviceBrandModel
    .find(query)
    .sort({ order_no: -1 })
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
  let data = await deviceBrandModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const getByParent = catchAsyncError(async (req, res, next) => {
  let data = await deviceBrandModel
    .find({ parent_name: req.query.parent_name })
    .select("_id name parent_name");

  if (data.length === 0) {
    return res.status(404).send({ message: "No data found" });
  }
  res.status(200).send({
    message: "success",
    status: 200,
    data: data,
  });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("req.files", req.files);
  const { token } = req.cookies;
  let newIdserial;
  let newIdNo;
  let newId;
  if (req.body.parent_id === "") {
    req.body.parent_id = null;
  }
  const lastDoc = await deviceBrandModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].device_brand_id.slice(0, 2);
    newIdNo = parseInt(lastDoc[0].device_brand_id.slice(2)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "db100";
  }

  let imageData = [];
  if (req.files && req.files.image) {
    imageData = await imageUpload(req.files.image, "device", next);
  }
  console.log("imageData", imageData);

  let iconData = [];
  if (req.files && req.files.icon) {
    iconData = await imageUpload(req.files.icon, "device", next);
  }
  console.log("iconData", iconData);
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    device_brand_id: newId,
    image: imageData[0],
    icon: iconData[0],
    created_by: decodedData?.user?.email,
  };

  const data = await deviceBrandModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;
  if (req.body.parent_id === "") {
    req.body.parent_id = null;
  }
  let data = await deviceBrandModel.findById(req.params.id);
  let oldParentName = data.name;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let imageData = [];
  let newData = req.body;
  if (req.files && req.files.image) {
    imageData = await imageUpload(req.files.image, "device", next);
  }

  if (imageData.length > 0) {
    newData = { ...req.body, image: imageData[0] };
  }
  if (data.image.public_id) {
    console.log("previous device image delete 111111");

    await imageDelete(data.image.public_id, next);
  }

  let iconData = [];
  if (req.files && req.files.icon) {
    iconData = await imageUpload(req.files.icon, "device", next);
  }
  if (iconData.length > 0) {
    newData = { ...newData, icon: iconData[0] };
  }
  if (data.icon.public_id) {
    console.log("previous device icon delete 111111");
    await imageDelete(data.icon.public_id, next);
  }

  newData = {
    ...newData,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };

  console.log("newData", newData);

  data = await deviceBrandModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  const childrenParentUpdate = await deviceBrandModel.updateMany(
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
  let data = await deviceBrandModel.findById(req.params.id);
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
  let parents = await deviceBrandModel.find({
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

const getLeafDeviceList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafDeviceList");
  const leafNodes2 = await deviceBrandModel.aggregate([
    // { $match: { parent_name: "Mobile" } },
    {
      $lookup: {
        from: "devices",
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
    { $project: { _id: 1, name: 1, parent_name: 1, device_brand_id: 1 } },
  ]);

  // res.json(leafNodes2);

  res.status(200).json({
    success: true,
    message: "successful",
    data: leafNodes2,
  });
});
const getDeviceWiseFilterList = catchAsyncError(async (req, res, next) => {
  console.log("req.body 3213231", req.body);

  const leafNodes = await getAllLeafNodes(req.body);

  console.log("leafNodes", leafNodes.toString());

  const stringIds = [];
  leafNodes.map((res) => {
    stringIds.push(res.device_brand_id.toString());
  });

  console.log("stringIds", stringIds);
  // const stringIds = leafNodes.map((id) => id.toString());
  console.log(stringIds);
  const data = await filterModel
    .find(
      {
        device_brand_id: {
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
  getParentDropdown,
  getLeafDeviceList,
  getDataWithPagination,
  getById,
  getByParent,
  createData,
  updateData,
  deleteData,
  getDeviceWiseFilterList,
  getListGroupByParent,
};
