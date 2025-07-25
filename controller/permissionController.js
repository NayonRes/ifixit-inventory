const permissionModel = require("../db/models/permissionModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const formatDate = require("../utils/formatDate");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  const data = await permissionModel.find({}, "name permission_id").lean();
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});

const getLeafPermissionList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafPermissionList");
  const leafNodes2 = await permissionModel.aggregate([
    // { $match: { parent_name: "Mobile" } },
    {
      $lookup: {
        from: "permissions",
        localField: "name",
        foreignField: "module_name",
        as: "children",
      },
    },
    {
      $addFields: {
        isLeaf: { $eq: ["$children", []] },
      },
    },
    { $match: { isLeaf: true } },
    { $project: { _id: 1, name: 1, module_name: 1, permission_id: 1 } },
    // { $project: { _id: 1, name: 1, module_name: 1, category_id: 1 } },
    { $sort: { module_name: 1 } },
  ]);

  // res.json(leafNodes2);

  res.status(200).json({
    success: true,
    message: "successful",
    data: leafNodes2,
  });
});
// const getCategoryWiseFilterList = catchAsyncError(async (req, res, next) => {
//   console.log("req.body", req.body.category_Ids);

//   const data = await permissionModel
//     .find(
//       {
//         category_id: {
//           $in: req.body.category_Ids,
//         },
//       },
//       "name module_name"
//     )
//     .lean()
//     .sort({ module_name: 1 });

//   let result = [];

//   data.map((p) => {
//     // filterValues.some((e) => e.filter_name === p.module_name);
//     if (!result.some((e) => e.filter_name === p.module_name)) {
//       let filterDataByParentName = data.filter(
//         (res) => res.module_name === p.module_name
//       );
//       result.push({
//         filter_name: p.module_name,
//         filter_values: filterDataByParentName,
//       });
//     }
//   });

//   res.status(200).json({
//     success: true,
//     message: "successful",
//     data: result,
//   });
// });

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  console.log(
    "totalData===================Permission==============111111111111"
  );

  let data = await permissionModel.find().lean();

  console.log(
    "totalData===================Permission==============2222222222222",
    data
  );

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getById = catchAsyncError(async (req, res, next) => {
  let data = await permissionModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  // let newIdserial;
  // let newIdNo;
  // let newId;
  // const lastDoc = await permissionModel.find().sort({ _id: -1 });
  // if (lastDoc.length > 0) {
  //   newIdserial = lastDoc[0].permission_id.slice(0, 3);
  //   newIdNo = parseInt(lastDoc[0].permission_id.slice(3)) + 1;
  //   newId = newIdserial.concat(newIdNo);
  // } else {
  //   newId = "per100";
  // }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    // permission_id: newId,
    created_by: decodedData?.user?.email,
  };

  const data = await permissionModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;
  let data = await permissionModel.findById(req.params.id);
  let oldParentName = data.name;
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };
  data = await permissionModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });
  const childrenParentUpdate = await permissionModel.updateMany(
    { module_name: oldParentName },
    { $set: { module_name: name } }
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
  let data = await permissionModel.findById(req.params.id);
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
  getParentDropdown,
  getLeafPermissionList,
  // getCategoryWiseFilterList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
