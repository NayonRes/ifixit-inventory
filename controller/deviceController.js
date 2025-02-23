const deviceModel = require("../db/models/deviceModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const { default: mongoose } = require("mongoose");

const getListGroupByParent = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await deviceModel.find().lean();

  const groupsList = await deviceModel.aggregate([
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

  const data = await deviceModel.find({}, "name device_id parent_name").lean();

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

  // const data = await deviceModel.find().lean();
  let query = {};
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }
  const data = await deviceModel
    .find(query, "name device_id parent_name")
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
    query.status = req.query.status;
  }
  // if (req.query.parent_name) {
  //   query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  // }
  if (req.query.order_no && !isNaN(req.query.order_no)) {
    query.order_no = parseInt(req.query.order_no);
  }
  if (req.query.parent_id) {
    query.parent_id = new mongoose.Types.ObjectId(req.query.parent_id);
  }
  let totalData = await deviceModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await deviceModel
  //   .find(query)
  //   .sort({ order_no: -1 })
  //   .skip(startIndex)
  //   .limit(limit);

  const data = await deviceModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "device-brands",
        localField: "device_brand_id",
        foreignField: "_id",
        as: "device_brand_data",
      },
    },
    {
      $lookup: {
        from: "devices",
        localField: "parent_id",
        foreignField: "_id",
        as: "parent_data",
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        images: 1,
        device_brand_id: 1,
        parent_id: 1,
        order_no: 1,
        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        "device_brand_data._id": 1,
        "device_brand_data.name": 1,
        "parent_data._id": 1,
        "parent_data.name": 1,
      },
    },
    {
      $sort: { order_no: -1 },
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
  let data = await deviceModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const getByParent = catchAsyncError(async (req, res, next) => {
  let data = await deviceModel
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
  const lastDoc = await deviceModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].device_id.slice(0, 1);
    newIdNo = parseInt(lastDoc[0].device_id.slice(1)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "d100";
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
    device_id: newId,
    image: imageData[0],
    icon: iconData[0],
    created_by: decodedData?.user?.email,
  };

  const data = await deviceModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;
  if (req.body.parent_id === "") {
    req.body.parent_id = null;
  }
  let data = await deviceModel.findById(req.params.id);
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

  data = await deviceModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  // const childrenParentUpdate = await deviceModel.updateMany(
  //   { parent_name: oldParentName },
  //   { $set: { parent_name: name } }
  // );
  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    // childrenParentUpdate,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await deviceModel.findById(req.params.id);
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
  let parents = await deviceModel.find({
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

// const getLeafDeviceList = catchAsyncError(async (req, res, next) => {
//   console.log("getLeafDeviceList");
//   const leafNodes2 = await deviceModel.aggregate([
//     // { $match: { parent_name: "Mobile" } },
//     {
//       $lookup: {
//         from: "devices",
//         localField: "name",
//         foreignField: "parent_name",
//         as: "children",
//       },
//     },
//     {
//       $addFields: {
//         isLeaf: { $eq: ["$children", []] },
//       },
//     },
//     { $match: { isLeaf: true } },
//     { $project: { _id: 1, name: 1, parent_name: 1, device_id: 1 } },
//   ]);

//   // res.json(leafNodes2);

//   res.status(200).json({
//     success: true,
//     message: "successful",
//     data: leafNodes2,
//   });
// });
const getLeafDeviceList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafDeviceList");

  const leafNodes = await deviceModel.aggregate([
    {
      $lookup: {
        from: "devices", // Collection name
        localField: "_id",
        foreignField: "parent_id",
        as: "children",
      },
    },
    {
      $addFields: {
        isLeaf: { $eq: ["$children", []] },
      },
    },
    { $match: { isLeaf: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        parent_id: 1, // Instead of `parent_name`
        device_id: 1,
        order_no: 1, // Include order_no for sorting
      },
    },
    { $sort: { order_no: 1 } }, // Sorting by order_no
  ]);

  res.status(200).json({
    success: true,
    message: "Successful",
    data: leafNodes,
  });
});
const getDeviceWiseFilterList = catchAsyncError(async (req, res, next) => {
  console.log("req.body 3213231", req.body);

  const leafNodes = await getAllLeafNodes(req.body);

  console.log("leafNodes", leafNodes.toString());

  const stringIds = [];
  leafNodes.map((res) => {
    stringIds.push(res.device_id.toString());
  });

  console.log("stringIds", stringIds);
  // const stringIds = leafNodes.map((id) => id.toString());
  console.log(stringIds);
  const data = await filterModel
    .find(
      {
        device_id: {
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
