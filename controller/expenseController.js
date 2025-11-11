const expenseModel = require("../db/models/expenseModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const formatDate = require("../utils/formatDate");
const {
  createTransaction,
  updateTransaction,
} = require("./transactionHistoryController");
const transactionHistoryModel = require("../db/models/transactionHistoryModel");

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
    query.status = req.query.status === "true";
  }
  if (req.query.expense_category_id) {
    query.expense_category_id = new mongoose.Types.ObjectId(
      req.query.expense_category_id
    );
  }
  if (req.query.branch_id) {
    query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  console.log("startDate", startDate);
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
  let totalData = await expenseModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  // const data = await expenseModel.find(query).skip(startIndex).limit(limit);

  const data = await expenseModel.aggregate([
    {
      $match: query,
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
        from: "expense_categories",
        localField: "expense_category_id",
        foreignField: "_id",
        as: "expense_category_data",
      },
    },

    {
      $project: {
        _id: 1,

        amount: 1,
        expense_date: 1,
        branch_id: 1,
        expense_category_id: 1,

        remarks: 1,

        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,

        "branch_data.name": 1,
        "expense_category_data.name": 1,
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
  let data = await expenseModel.findById(req.params.id);
  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});

// const createData = catchAsyncError(async (req, res, next) => {
//   const { token } = req.cookies;

//   let decodedData = jwt.verify(token, process.env.JWT_SECRET);
//   let newData = {
//     ...req.body,
//     created_by: decodedData?.user?.email,
//   };

//   const data = await expenseModel.create(newData);
//   res.send({ message: "success", status: 201, data: data });
// });
const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Step 1: Prepare expense data

      const lastDoc = await expenseModel.find().sort({ _id: -1 });
      let newId;
      if (lastDoc.length > 0) {
        const serial = lastDoc[0].expense_id.slice(0, 2);
        const number = parseInt(lastDoc[0].expense_id.slice(2)) + 1;
        newId = serial.concat(number);
      } else {
        newId = "EX10000";
      }

      const newData = {
        ...req.body,
        expense_id: newId,
        created_by: decodedData?.user?.email,
      };

      // Step 2: Create expense
      const data = await expenseModel.create([newData], { session });
      const expense = data[0];

      if (!expense) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Failed to create expense" });
      }

      // Step 3: Optional transaction history
      let transactionData = null;
      if (
        Array.isArray(req.body?.transaction_info) &&
        req.body.transaction_info.length > 0
      ) {
        transactionData = await createTransaction(
          req.body?.transaction_name,
          expense._id, // transaction_source_id
          req.body.transaction_info, // transaction_info
          "expense", // transaction_source_type
          "debit", // transaction_type
          decodedData?.user?.email, // created_by
          session // pass session
        );

        if (!transactionData) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ message: "Failed to save transaction history" });
        }
      }

      // Step 4: Send response
      return res.status(201).json({
        message: "Success",
        status: 201,
        data: expense,
        transactionData,
      });
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    next(error);
  } finally {
    session.endSession();
  }
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const transactionSourceId = req.params.id;

  // Step 0: Check if transaction is completed
  const existingTransaction = await transactionHistoryModel.findOne({
    transaction_source_id: transactionSourceId,
  });

  if (existingTransaction?.is_collection_received) {
    return next(
      new ErrorHander("Transaction is completed, so you cannot update.", 400)
    );
  }

  // Step 1: Start session
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Step 2: Find existing expense
      let expense = await expenseModel
        .findById(transactionSourceId)
        .session(session);

      if (!expense) {
        await session.abortTransaction();
        return next(new ErrorHander("No data found", 404));
      }

      // Step 3: Prepare updated expense data
      const updatedData = {
        ...req.body,
        updated_by: decodedData?.user?.email,
        updated_at: new Date(),
      };

      // Step 4: Update expense
      expense = await expenseModel.findByIdAndUpdate(
        transactionSourceId,
        updatedData,
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!expense) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Failed to update expense" });
      }

      // Step 5: Optional transaction history update
      let transactionData = null;
      if (
        Array.isArray(req.body?.transaction_info) &&
        req.body.transaction_info.length > 0
      ) {
        transactionData = await updateTransaction(
          req.body?.transaction_name,
          expense._id, // transaction_source_id
          req.body.transaction_info, // transaction_info
          "expense", // transaction_source_type
          "debit", // transaction_type
          decodedData?.user?.email, // updated_by
          session // pass session
        );

        if (!transactionData) {
          await session.abortTransaction();
          return res
            .status(404)
            .json({ message: "Failed to update transaction history" });
        }
      }

      // Step 6: Send response
      return res.status(200).json({
        success: true,
        message: "Update successfully",
        data: expense,
        transactionData,
      });
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    next(error);
  } finally {
    session.endSession();
  }
});

// const updateData = catchAsyncError(async (req, res, next) => {
//   const { token } = req.cookies;

//   let data = await expenseModel.findById(req.params.id);

//   if (!data) {
//     console.log("if");
//     return next(new ErrorHander("No data found", 404));
//   }
//   let decodedData = jwt.verify(token, process.env.JWT_SECRET);

//   const newData = {
//     ...req.body,
//     updated_by: decodedData?.user?.email,
//     updated_at: new Date(),
//   };

//   data = await expenseModel.findByIdAndUpdate(req.params.id, newData, {
//     new: true,
//     runValidators: true,
//     useFindAndModified: false,
//   });

//   // const childrenParentUpdate = await expenseModel.updateMany(
//   //   { parent_name: oldParentName },
//   //   { $set: { parent_name: name } }
//   // );
//   res.status(200).json({
//     success: true,
//     message: "Update successfully",
//     data: data,
//     // childrenParentUpdate,
//   });
// });

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await expenseModel.findById(req.params.id);
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
