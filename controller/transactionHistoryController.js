const transactionHistoryModel = require("../db/models/transactionHistoryModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const formatDate = require("../utils/formatDate");
const { default: mongoose } = require("mongoose");

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await transactionHistoryModel.find().lean();
  const data = await transactionHistoryModel
    .find({}, "name category_id")
    .lean();

  console.log("category list----------------", data);

  res.status(200).json({
    success: true,
    message: "successful",
    data: data,
  });
});
const getAllData = catchAsyncError(async (req, res, next) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const query = {};

  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }

  if (req.query.is_collection_received) {
    query.is_collection_received = req.query.is_collection_received === "true";
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  console.log("startDate", startDate);
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
  const totalData = await transactionHistoryModel.countDocuments(query);

  const data = await transactionHistoryModel
    .find(query)
    .populate({
      path: "transaction_source_id", // dynamic based on refPath
      select:
        "name title _id repair_id warranty_id amount createdAt usedated At remarks", // optional fields
    })

    .sort({ createdAt: -1 }); // newest first

  res.status(200).json({
    success: true,
    message: "successful",
    totalData,

    data,
  });
});

// const getAllData = catchAsyncError(async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   console.log("===========req.query.page", req.query.page);
//   const limit = parseInt(req.query.limit) || 10;
//   const startIndex = (page - 1) * limit;
//   const endIndex = page * limit;
//   var query = {};
//   query.name = { ...query.name, $ne: "Primary" };
//   if (req.query.name) {
//     query.name = new RegExp(`^${req.query.name}$`, "i");
//   }
//   if (req.query.status) {
//     query.status = req.query.status === "true";
//   }

//   let totalData = await transactionHistoryModel.countDocuments(query);
//   console.log("totalData=================================", totalData);
//   const data = await transactionHistoryModel.find(query);

//   console.log("data", data);
//   res.status(200).json({
//     success: true,
//     message: "successful",
//     data: data,
//     totalData: totalData,
//   });
// });

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  var query = {};
  query.name = { ...query.name, $ne: "Primary" };
  if (req.query.name) {
    query.name = new RegExp(`^${req.query.name}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }

  console.log("startDate", startDate);
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
  let totalData = await transactionHistoryModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await transactionHistoryModel
    .find(query)
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
  let data = await transactionHistoryModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
  console.log("transaction===============================history", req.body);

  const { token } = req.cookies;

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,

    created_by: decodedData?.user?.email,
  };

  const data = await transactionHistoryModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

// using this for use inside other controller
async function createTransaction(
  transaction_name,
  transaction_source_id,
  transaction_info,
  transaction_source_type,
  transaction_type,
  created_by,
  session = null
) {
  try {
    console.log(
      "params---------------------------",
      transaction_source_id,
      transaction_info,
      transaction_source_type,
      transaction_type,
      created_by
    );
    const sourceId =
      typeof transaction_source_id === "string"
        ? new mongoose.Types.ObjectId(transaction_source_id)
        : transaction_source_id;
    const newTransaction = [
      {
        transaction_name,
        transaction_source_id: sourceId,
        transaction_info: Array.isArray(transaction_info)
          ? transaction_info
          : [],
        transaction_source_type,
        transaction_type,
        created_by,
      },
    ];
    console.log("newTransaction", newTransaction);

    const options = session ? { session } : {};
    const data = await transactionHistoryModel.create(newTransaction, options);

    console.log(
      `Transaction history created for ${transaction_source_type} (${transaction_source_id})`
    );

    return data;
  } catch (err) {
    console.error("Error creating transaction history:", err);
    throw err;
  }
}

async function updateTransaction(
  transaction_name,
  transaction_source_id,
  transaction_info,
  transaction_source_type,
  transaction_type,
  updated_by,
  session = null
) {
  try {
    console.log(
      "Update params---------------------------",
      transaction_source_id,
      transaction_info,
      transaction_source_type,
      transaction_type,
      updated_by
    );

    const sourceId =
      typeof transaction_source_id === "string"
        ? new mongoose.Types.ObjectId(transaction_source_id)
        : transaction_source_id;

    const options = session ? { session, new: true } : { new: true };

    const data = await transactionHistoryModel.findOneAndUpdate(
      { transaction_source_id: sourceId },
      {
        $set: {
          transaction_name,
          transaction_info: Array.isArray(transaction_info)
            ? transaction_info
            : [],
          transaction_source_type,
          transaction_type,
          updated_by,
          updated_at: new Date(),
        },
      },
      options
    );

    if (!data) {
      console.log(
        `No transaction history found for source_id: ${transaction_source_id}`
      );
      return null;
    }

    console.log(
      `Transaction history updated for source_id: ${transaction_source_id}`
    );

    return data;
  } catch (err) {
    console.error("Error updating transaction history:", err);
    throw err;
  }
}
const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await transactionHistoryModel.findById(req.params.id);
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

  data = await transactionHistoryModel.findByIdAndUpdate(
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
    data: data,
  });
});
const updateCollectionStatus = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const updates = req.body.transaction_received_status_list; // Expecting an array of objects [{ _id, is_collection_received }]

  if (!Array.isArray(updates) || updates.length === 0) {
    return next(new ErrorHander("Invalid or empty update data", 400));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ErrorHander("Invalid or expired token", 401));
  }

  // Prepare bulk update operations
  const bulkOps = updates.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: {
        $set: {
          is_collection_received: item.is_collection_received,
          updated_by: decodedData?.user?.email,
          updated_at: new Date(),
        },
      },
    },
  }));

  // Perform bulk update
  const result = await transactionHistoryModel.bulkWrite(bulkOps);

  res.status(200).json({
    success: true,
    message: "Collection status updated successfully",
    result,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await transactionHistoryModel.findById(req.params.id);
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
  let parents = await transactionHistoryModel.find({
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

const getLeafCategoryList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafCategoryList");
  const leafNodes2 = await transactionHistoryModel.aggregate([
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
    { $project: { _id: 1, name: 1, parent_name: 1, category_id: 1 } },
  ]);

  // res.json(leafNodes2);

  res.status(200).json({
    success: true,
    message: "successful",
    data: leafNodes2,
  });
});
const getCategoryWiseFilterList = catchAsyncError(async (req, res, next) => {
  console.log("req.body 3213231", req.body);

  const leafNodes = await getAllLeafNodes(req.body);

  console.log("leafNodes", leafNodes.toString());

  const stringIds = [];
  leafNodes.map((res) => {
    stringIds.push(res.category_id.toString());
  });

  console.log("stringIds", stringIds);
  // const stringIds = leafNodes.map((id) => id.toString());
  console.log(stringIds);
  const data = await filterModel
    .find(
      {
        category_id: {
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
  getAllData,
  getParentDropdown,
  getLeafCategoryList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getCategoryWiseFilterList,
  createTransaction,
  updateTransaction,
  updateCollectionStatus,
};
