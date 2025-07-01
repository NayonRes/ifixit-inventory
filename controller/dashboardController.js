const branchModel = require("../db/models/branchModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const filterModel = require("../db/models/filterModel");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");
const expenseModel = require("../db/models/expenseModel");
const formatDate = require("../utils/formatDate");
const { default: mongoose } = require("mongoose");
const purchaseProductModel = require("../db/models/purchaseProductModel");
const stockModel = require("../db/models/stockModel");
const customerModel = require("../db/models/customerModel");
const supplierModel = require("../db/models/supplierModel");
const repairModel = require("../db/models/repairModel");

const getStats = async (req, res) => {
  try {
    // Customer/Supplier Query
    const customerAndSupplierQuery = { status: true };

    // Expense Query
    const expenseQuery = { status: true };

    // Purchase Query (based on 'purchases' collection)
    const purchaseQuery = { status: true };

    // Stock Query (joined with purchase_products)
    const stockQuery = { status: true, stock_status: "Returned" };

    // Parse Dates
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (req.query.branch_id) {
      const branchId = new mongoose.Types.ObjectId(req.query.branch_id);
      // customerAndSupplierQuery.branch_id = branchId;
      expenseQuery.branch_id = branchId;
      purchaseQuery.branch_id = branchId;
      stockQuery.branch_id = branchId;
    }

    if (startDate && endDate) {
      const dateRange = {
        $gte: formatDate(startDate, "start", false),
        $lte: formatDate(endDate, "end", false),
      };
      customerAndSupplierQuery.created_at = dateRange;
      expenseQuery.expense_date = dateRange;
      purchaseQuery.purchase_date = dateRange;
      stockQuery.updated_at = dateRange;
    } else if (startDate) {
      const date = { $gte: formatDate(startDate, "start", false) };
      customerAndSupplierQuery.created_at = date;
      expenseQuery.expense_date = date;
      purchaseQuery.purchase_date = date;
      stockQuery.updated_at = date;
    } else if (endDate) {
      const date = { $lte: formatDate(endDate, "end", false) };
      customerAndSupplierQuery.created_at = date;
      expenseQuery.expense_date = date;
      purchaseQuery.purchase_date = date;
      stockQuery.updated_at = date;
    }

    // Run all operations in parallel
    const [
      expenseData,
      purchaseData,
      returnedStockData,
      totalCustomerCount,
      totalSupplierCount,
    ] = await Promise.all([
      // Total Expense
      expenseModel.aggregate([
        { $match: expenseQuery },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // Total Purchase (purchase_products * unit_price joined with purchases)

      purchaseProductModel.aggregate([
        {
          $lookup: {
            from: "purchases",
            localField: "purchase_id",
            foreignField: "_id",
            as: "purchase",
          },
        },
        { $unwind: "$purchase" },
        {
          $match: {
            "purchase.status": true,
            ...(req.query.branch_id && {
              "purchase.branch_id": new mongoose.Types.ObjectId(
                req.query.branch_id
              ),
            }),
            ...(req.query.startDate || req.query.endDate
              ? {
                  "purchase.purchase_date": {
                    ...(req.query.startDate && {
                      $gte: formatDate(req.query.startDate, "start", false),
                    }),
                    ...(req.query.endDate && {
                      $lte: formatDate(req.query.endDate, "end", false),
                    }),
                  },
                }
              : {}),
          },
        },
        {
          $project: {
            quantity: { $toDouble: "$quantity" },
            unit_price: { $toDouble: "$unit_price" },
          },
        },
        {
          $project: {
            total: { $multiply: ["$quantity", "$unit_price"] },
          },
        },
        {
          $group: {
            _id: null,
            grandTotal: { $sum: "$total" },
          },
        },
      ]),
      // Returned stock total unit_price
      stockModel.aggregate([
        { $match: stockQuery },
        {
          $lookup: {
            from: "purchase_products",
            localField: "purchase_product_id",
            foreignField: "_id",
            as: "purchase_product",
          },
        },
        { $unwind: "$purchase_product" },
        {
          $project: {
            unit_price: { $toDouble: "$purchase_product.unit_price" },
          },
        },
        {
          $group: {
            _id: null,
            totalReturnedUnitPrice: { $sum: "$unit_price" },
          },
        },
      ]),

      // Customer count
      customerModel.countDocuments(customerAndSupplierQuery),

      // Supplier count
      supplierModel.countDocuments(customerAndSupplierQuery),
    ]);

    // Final totals with default 0
    const totalExpense = expenseData[0]?.totalAmount || 0;
    const totalPurchase = purchaseData[0]?.grandTotal || 0;
    const totalReturned = returnedStockData[0]?.totalReturnedUnitPrice || 0;
    const totalCustomer = totalCustomerCount || 0;
    const totalSupplier = totalSupplierCount || 0;

    // Response
    res.status(200).json({
      totalExpense,
      totalPurchase,
      totalReturned,
      totalCustomer,
      totalSupplier,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getStats2 = catchAsyncError(async (req, res, next) => {
  let data = {};
  var query = { status: true };
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (startDate && endDate) {
    query.expense_date = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    query.expense_date = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    query.expense_date = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  const expenseData = await expenseModel.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const purchaseData = await purchaseProductModel.aggregate([
    {
      $lookup: {
        from: "purchases", // name of the parent collection
        localField: "purchase_id", // field in purchase_products
        foreignField: "_id", // field in purchases
        as: "purchase",
      },
    },
    { $unwind: "$purchase" },
    {
      $match: {
        "purchase.status": true,
        ...(req.query.branch_id && {
          "purchase.branch_id": new mongoose.Types.ObjectId(
            req.query.branch_id
          ),
        }),
        ...(req.query.startDate || req.query.endDate
          ? {
              "purchase.purchase_date": {
                ...(req.query.startDate && {
                  $gte: formatDate(req.query.startDate, "start", false),
                }),
                ...(req.query.endDate && {
                  $lte: formatDate(req.query.endDate, "end", false),
                }),
              },
            }
          : {}),
      },
    },
    {
      $project: {
        quantity: { $toDouble: "$quantity" },
        unit_price: { $toDouble: "$unit_price" },
      },
    },
    {
      $project: {
        total: { $multiply: ["$quantity", "$unit_price"] },
      },
    },
    {
      $group: {
        _id: null,
        grandTotal: { $sum: "$total" },
      },
    },
  ]);

  const returnProductQuery = { stock_status: "Returned", status: true };

  if (req.query.branch_id) {
    returnProductQuery.branch_id = new mongoose.Types.ObjectId(
      req.query.branch_id
    );
  }
  if (startDate && endDate) {
    returnProductQuery.updated_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    returnProductQuery.updated_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    returnProductQuery.updated_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  // Aggregation: from stocks to purchase_products, sum unit_price
  const returnedStockData = await stockModel.aggregate([
    {
      $match: returnProductQuery, // Filter directly on stocks
    },
    {
      $lookup: {
        from: "purchase_products",
        localField: "purchase_product_id",
        foreignField: "_id",
        as: "purchase_product",
      },
    },
    { $unwind: "$purchase_product" },
    {
      $project: {
        unit_price: { $toDouble: "$purchase_product.unit_price" },
      },
    },
    {
      $group: {
        _id: null,
        totalReturnedUnitPrice: { $sum: "$unit_price" },
      },
    },
  ]);
  var customerAndSupplierquery = { status: true };

  // if (req.query.branch_id) {
  //   customerAndSupplierquery.branch_id = new mongoose.Types.ObjectId(
  //     req.query.branch_id
  //   );
  // }
  if (startDate && endDate) {
    customerAndSupplierquery.created_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    customerAndSupplierquery.created_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    customerAndSupplierquery.created_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }
  const totalCustomer = await customerModel.countDocuments(
    customerAndSupplierquery
  );
  const totalSupplier = await supplierModel.countDocuments(
    customerAndSupplierquery
  );
  const totalExpense = expenseData.length > 0 ? expenseData[0].totalAmount : 0;
  const totalPurchase = purchaseData[0]?.grandTotal || 0;
  const totalReturned = returnedStockData[0]?.totalReturnedUnitPrice || 0;
  res.send({
    message: "success",
    status: 200,
    data: {
      totalExpense,
      totalPurchase,
      totalReturned,
      totalCustomer,
      totalSupplier,
    },
  });
});
const getRepairSummary2 = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate, branch_id } = req.query;

  const repairQuery = { status: true };

  if (branch_id) {
    repairQuery._branch_id = new mongoose.Types.ObjectId(branch_id);
  }

  if (startDate && endDate) {
    repairQuery.created_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    repairQuery.created_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    repairQuery.created_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  const repairSummary = await repairModel.aggregate([
    { $match: repairQuery },

    // Step 1: Calculate totalRepairCost and totalProductPrice per document
    {
      $addFields: {
        totalRepairCost: {
          $sum: {
            $map: {
              input: "$issues",
              as: "issue",
              in: { $ifNull: ["$$issue.repair_cost", 0] },
            },
          },
        },
        totalProductPrice: {
          $sum: {
            $map: {
              input: "$product_details",
              as: "product",
              in: { $ifNull: ["$$product.price", 0] },
            },
          },
        },
      },
    },

    // Step 2: Group by _branch_id
    {
      $group: {
        _id: "$_branch_id",
        totalRepairCost: { $sum: "$totalRepairCost" },
        totalProductPrice: { $sum: "$totalProductPrice" },
        totalRepairs: { $sum: 1 },
      },
    },

    // Step 3: Optional - populate branch info
    {
      $lookup: {
        from: "branches",
        localField: "_id",
        foreignField: "_id",
        as: "branchInfo",
      },
    },
    { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

    // Step 4: Final projection
    {
      $project: {
        _id: 0,
        branch_id: "$_id",
        totalRepairs: 1,
        totalRepairCost: 1,
        totalProductPrice: 1,
        branch: "$branchInfo",
      },
    },
  ]);

  res.send({
    message: "success",
    status: 200,
    data: repairSummary,
  });
});

const getRepairSummary = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate, branch_id } = req.query;

  const repairQuery = { status: true };

  if (branch_id) {
    repairQuery._branch_id = new mongoose.Types.ObjectId(branch_id);
  }

  if (startDate && endDate) {
    repairQuery.created_at = {
      $gte: formatDate(startDate, "start", false),
      $lte: formatDate(endDate, "end", false),
    };
  } else if (startDate) {
    repairQuery.created_at = {
      $gte: formatDate(startDate, "start", false),
    };
  } else if (endDate) {
    repairQuery.created_at = {
      $lte: formatDate(endDate, "end", false),
    };
  }

  const repairSummary = await repairModel.aggregate([
    { $match: repairQuery },

    {
      $group: {
        _id: "$_branch_id",
        repairs: { $push: "$$ROOT" },
      },
    },

    {
      $lookup: {
        from: "branches",
        localField: "_id",
        foreignField: "_id",
        as: "branchInfo",
      },
    },
    { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 0,
        branch_id: "$_id",
        branch: "$branchInfo",
        repairs: 1,
      },
    },
  ]);

  res.send({
    message: "success",
    status: 200,
    data: repairSummary,
  });
});

const getParentDropdown = catchAsyncError(async (req, res, next) => {
  console.log(
    "getParentDropdown===================================================="
  );

  // const data = await branchModel.find().lean();
  const data = await branchModel.find({}, "name branch_id").lean();

  console.log("branch list----------------", data);

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
  if (req.query.phone_no_1) {
    query.phone_no_1 = new RegExp(`^${req.query.phone_no_1}$`, "i");
  }
  if (req.query.status) {
    query.status = req.query.status === "true";
  }
  if (req.query.parent_name) {
    query.parent_name = new RegExp(`^${req.query.parent_name}$`, "i");
  }
  let totalData = await branchModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  const data = await branchModel.find(query).skip(startIndex).limit(limit);
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
  let data = await branchModel.findById(req.params.id);
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
  const lastDoc = await branchModel.find().sort({ _id: -1 });
  if (lastDoc.length > 0) {
    newIdserial = lastDoc[0].branch_id.slice(0, 1);
    newIdNo = parseInt(lastDoc[0].branch_id.slice(1)) + 1;
    newId = newIdserial.concat(newIdNo);
  } else {
    newId = "b100";
  }

  let imageData = [];
  let map_imageData = [];
  if (req.files && req.files.image) {
    if (req.files.image) {
      imageData = await imageUpload(req.files.image, "branch", next);
    }
    if (req.files.map_image) {
      map_imageData = await imageUpload(req.files.map_image, "branch", next);
    }
  }
  const mainBranch = await branchModel.find({ is_main_branch: true });
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  let newData = {
    ...req.body,
    branch_id: newId,
    parent_id: mainBranch[0]._id,
    image: imageData[0],
    map_image: map_imageData[0],
    created_by: decodedData?.user?.email,
  };

  const data = await branchModel.create(newData);
  res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await branchModel.findById(req.params.id);
  let oldParentName = data.name;

  if (!data) {
    console.log("if");
    return next(new ErrorHander("No data found", 404));
  }

  let imageData = [];
  let map_imageData = [];
  let newData = { ...req.body };

  if (req.files) {
    if (req.files.image) {
      imageData = await imageUpload(req.files.image, "branch", next);
    }
    if (req.files.map_image) {
      map_imageData = await imageUpload(req.files.map_image, "branch", next);
    }
  }

  console.log("image data =========", imageData);
  console.log("map_image data =========", map_imageData);
  if (imageData.length > 0) {
    newData.image = imageData[0];
  }
  if (map_imageData.length > 0) {
    newData.map_image = map_imageData[0];
  }
  if (data.image.public_id) {
    console.log("previous branch image delete 111111");
    await imageDelete(data.image.public_id, next);
  }
  if (data.map_image.public_id) {
    console.log("previous branch image delete 111111");
    await imageDelete(data.map_image.public_id, next);
  }

  let decodedData = jwt.verify(token, process.env.JWT_SECRET);
  newData.updated_by = decodedData?.user?.email;
  newData.updated_at = new Date();

  data = await branchModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  // const childrenParentUpdate = await branchModel.updateMany(
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
  let data = await branchModel.findById(req.params.id);
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
  let parents = await branchModel.find({
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

const getLeafBranchList = catchAsyncError(async (req, res, next) => {
  console.log("getLeafBranchList");
  const leafNodes2 = await branchModel.aggregate([
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
    { $project: { _id: 1, name: 1, parent_name: 1, branch_id: 1 } },
  ]);

  // res.json(leafNodes2);

  res.status(200).json({
    success: true,
    message: "successful",
    data: leafNodes2,
  });
});
const getBranchWiseFilterList = catchAsyncError(async (req, res, next) => {
  console.log("req.body 3213231", req.body);

  const leafNodes = await getAllLeafNodes(req.body);

  console.log("leafNodes", leafNodes.toString());

  const stringIds = [];
  leafNodes.map((res) => {
    stringIds.push(res.branch_id.toString());
  });

  console.log("stringIds", stringIds);
  // const stringIds = leafNodes.map((id) => id.toString());
  console.log(stringIds);
  const data = await filterModel
    .find(
      {
        branch_id: {
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
  getStats,
  getRepairSummary,
  getParentDropdown,
  getLeafBranchList,
  getDataWithPagination,
  getById,
  createData,
  updateData,
  deleteData,
  getBranchWiseFilterList,
};
