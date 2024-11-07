const filterModel = require("../db/models/filterModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  const data = await filterModel.find({}, "name filter_id").lean();
  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
// const getCategoryWiseFilterList = catchAsyncError(async (req, res, next) => {
//   console.log("req.body", req.body.category_Ids);

//   const data = await filterModel
//     .find(
//       {
//         category_id: {
//           $in: req.body.category_Ids,
//         },
//       },
//       "name parent_name"
//     )
//     .lean()
//     .sort({ parent_name: 1 });

//   let result = [];

//   data.map((p) => {
//     // filterValues.some((e) => e.filter_name === p.parent_name);
//     if (!result.some((e) => e.filter_name === p.parent_name)) {
//       let filterDataByParentName = data.filter(
//         (res) => res.parent_name === p.parent_name
//       );
//       result.push({
//         filter_name: p.parent_name,
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
  const page = parseInt(req.query.page) || 1;
  console.log("===Filter========req.query.page", req.query.page);
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
  let totalData = await filterModel.countDocuments(query);
  console.log("totalData=================================", totalData);

  // let data = await filterModel.find(query).skip(startIndex).limit(limit);

  // const data = filterModel.aggregate([
  //   {
  //     $graphLookup: {
  //       from: "filters",
  //       startWith: "$parent_name",
  //       connectFromField: "parent_name",
  //       connectToField: "name",
  //       as: "reportingHierarchy",
  //     },
  //   },
  // ]);

  // this query for name with parent list
  const pipeline = [
    {
      $match: query,
    },
    {
      $graphLookup: {
        from: "filters",
        startWith: "$name",
        connectFromField: "parent_name",
        connectToField: "parent_name",
        maxDepth: 1,
        as: "children",
      },
    },
    // {
    //   $sort: { parent_name: 1 },
    // },
  ];

  const data = await filterModel
    .aggregate(pipeline)
    .skip(startIndex)
    .limit(limit)
    .exec();
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
  let data = await filterModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  let newIdserial;
  let newIdNo;
  let newId;
  const lastDoc = await filterModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].filter_id.slice(0, 1);
    newIdNo = parseInt(lastDoc[0].filter_id.slice(1)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "f100";
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  let newData = {
    ...req.body,
    filter_id: newId,
    created_by: decodedData?.user?.email,
  };

  const data = await filterModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;
  let data = await filterModel.findById(req.params.id);
  let oldParentName = data.name;
  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const newData = {
    ...req.body,
    updated_by: decodedData?.user?.email,
    updated_at: new Date(),
  };
  data = await filterModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });
  const childrenParentUpdate = await filterModel.updateMany(
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
  let data = await filterModel.findById(req.params.id);
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
  // getCategoryWiseFilterList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
};
