const sparePartsSkuModel = require("../db/models/sparePartsStockModel");
const counterModel = require("../db/models/counterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const purchaseModel = require("../db/models/purchaseModel");
const purchaseProductModel = require("../db/models/purchaseProductModel");


const getDataWithPagination = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  console.log("===========req.query.page", req.query.page);
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  var query = {};
  if (req.query.sku_number) {
    query.sku_number = new RegExp(`^${req.query.sku_number}$`, "i");
  }

  if (req.query.spare_parts_id) {
    query.category_id = new mongoose.Types.ObjectId(req.query.spare_parts_id);
  }
  if (req.query.spare_parts_variation_id) {
    query.brand_id = new mongoose.Types.ObjectId(req.query.spare_parts_variation_id);
  }
  if (req.query.branch_id) {
    query.device_id = new mongoose.Types.ObjectId(req.query.branch_id);
  }
  if (req.query.purchase_id) {
    query.model_id = new mongoose.Types.ObjectId(req.query.purchase_id);
  }

  let totalData = await sparePartsSkuModel.countDocuments(query);
  console.log("totalData=================================", totalData);
  //const data = await sparePartsSkuModel.find(query).skip(startIndex).limit(limit);

  const data = await sparePartsSkuModel.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "spareparts",
        localField: "spare_parts_id",
        foreignField: "_id",
        as: "sparepart_data",
      },
    },
    {
      $lookup: {
        from: "sparepartvariations",
        localField: "spare_parts_variation_id",
        foreignField: "_id",
        as: "sparepartvariation_data",
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
        from: "purchases",
        localField: "purchase_id",
        foreignField: "_id",
        as: "purchase_data",
      },
    },
    {
      $project: {
        _id: 1,
        spare_parts_id: 1,
        spare_parts_variation_id: 1,
        branch_id: 1,
        purchase_id: 1,
        sku_number: 1,
        sku_status: 1,
        sparePart_id: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        
        "sparepart_data.name": 1,
        "branch_data.name": 1,
        "sparepartvariation_data.name": 1,
        "purchase_data.purchase_date": 1,
        "purchase_data.supplier_id": 1,
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
  const data = await sparePartsSkuModel.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "spareparts",
        localField: "spare_parts_id",
        foreignField: "_id",
        as: "sparepart_data",
      },
    },
    {
      $lookup: {
        from: "sparepartvariations",
        localField: "spare_parts_variation_id",
        foreignField: "_id",
        as: "sparepartvariation_data",
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
        from: "purchases",
        localField: "purchase_id",
        foreignField: "_id",
        as: "purchase_data",
      },
    },
    {
      $project: {
        _id: 1,
        spare_parts_id: 1,
        spare_parts_variation_id: 1,
        branch_id: 1,
        purchase_id: 1,
        sku_number: 1,
        sku_status: 1,
        sparePart_id: 1,
        remarks: 1,
        status: 1,
        created_by: 1,
        created_at: 1,
        updated_by: 1,
        updated_at: 1,
        
        "sparepart_data.name": 1,
        "branch_data.name": 1,
        "sparepartvariation_data.name": 1,
        "purchase_data.purchase_date": 1,
        "purchase_data.is_sku_generated": 1,
        "purchase_data.supplier_id": 1,
      },
    },
  ]);

  if (!data) {
    return res.send({ message: "No data found", status: 404 });
  }
  res.send({ message: "success", status: 200, data: data });
});



// const createData = catchAsyncError(async (req, res, next) => {
//   const { token } = req.cookies;
//   const quantity = parseInt(req.body.quantity); 
//   const purchaseProductId = req.body.purchase_product_id;

 
//   // Start a session for the transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   console.log("-----------session started-----------",new Date());
//   try {
//     let purchaseProduct = await purchaseProductModel.findById({_id:purchaseProductId}).session(session);
//     // return res.status(200).send({ message: "purchase product found", status: 200 ,data:purchaseProduct});
    
//     if (purchaseProduct.is_sku_generated) {
//       return res.status(400).send({ message: "SKU already generated for this purchase.", status: 400 });
//     }
//     // Fetch the current counter by the key "sparePartsSku"
//     const counter = await counterModel.findOne({ key: "sparePartsSku" }).session(session);
//     console.log("------counter------",counter);

//     const lastSerial = counter ? counter.counter : 10000000; // Default to 0 if counter doesn't exist
//     const startSerial = lastSerial + 1;
//     const endSerial = lastSerial + quantity;
//     let decodedData = jwt.verify(token, process.env.JWT_SECRET);

//     const newSpareParts = [];
//     for (let i = 0; i < quantity; i++) {
//       const serialNumber = lastSerial + i+1;
//       newSpareParts.push({
//         ...req.body,
//         sku_number: serialNumber,
//         created_by: decodedData?.user?.email,
//       });
//     }

//     console.log("----new spare parts[]---",newSpareParts);
//     const data = await sparePartsSkuModel.insertMany(newSpareParts, { session });
//     await counterModel.findOneAndUpdate(
//       { key: "sparePartsSku" },
//       { $set: { counter: endSerial } },
//       { upsert: true, session }
//     );

//     await purchaseProductModel.findOneAndUpdate(
//       { _id: purchaseProductId }, 
//       { $set: { is_sku_generated: true } },
//       { session }
//     );

//     await session.commitTransaction();
//     console.log(`Serial numbers from SN${startSerial} to SN${endSerial} created.`);
//     res.send({ message: "success", status: 201, data: data });
//   } catch (error) {
//     // Roll back the transaction in case of an error
//     await session.abortTransaction();
//     console.error("Error processing product update:", error);
//     res.status(500).send("An error occurred while processing the product update.");
//   } finally {
//     // End the session
//     session.endSession();
//   }
// });

const createData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const quantity = parseInt(req.body.quantity);
  const purchaseProductId = req.body.purchase_product_id;

  // Validate request data
  if (!quantity || !purchaseProductId) {
    return res.status(400).send({ message: "Invalid input", status: 400 });
  }

  // Fetch the purchase product
  const purchaseProduct = await purchaseProductModel.findById({ _id: purchaseProductId });
  if (!purchaseProduct) {
    return res.status(404).send({ message: "Purchase product not found", status: 404 });
  }

  if (purchaseProduct.is_sku_generated) {
    return res.status(400).send({ message: "SKU already generated for this purchase.", status: 400 });
  }

  // Start a MongoDB session for a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("-----------session started-----------", new Date());

  try {
    // Atomic counter update with `$inc`
    const counter = await counterModel.findOneAndUpdate(
      { key: "sparePartsSku" },
      { $inc: { counter: quantity } },
      { upsert: true, returnDocument: "after", session }
    );

    // Calculate serial numbers
    const startSerial = counter.counter - quantity + 1;
    const endSerial = counter.counter;

    // Decode token to get user details
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decodedData?.user?.email;

    // Prepare new spare parts data
    const newSpareParts = Array.from({ length: quantity }, (_, i) => ({
      ...req.body,
      sku_number: startSerial + i, // Generate SKU numbers
      created_by: createdBy,
    }));

    // Insert the new spare parts
    const data = await sparePartsSkuModel.insertMany(newSpareParts, { session });

    // Update the purchase product to mark SKU as generated
    await purchaseProductModel.findOneAndUpdate(
      { _id: purchaseProductId },
      { $set: { is_sku_generated: true } },
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    console.log(`Serial numbers from SN${startSerial} to SN${endSerial} created.`);
    res.status(201).send({ message: "Success", status: 201, data });
  } catch (error) {
    // Roll back the transaction in case of an error
    await session.abortTransaction();
    console.error("Error processing product update:", error);
    res.status(500).send("An error occurred while processing the product update.");
  } finally {
    // End the session
    session.endSession();
  }
});

const updateData = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  const { name } = req.body;

  let data = await sparePartsSkuModel.findById(req.params.id);
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

  data = await sparePartsSkuModel.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModified: false,
  });

  res.status(200).json({
    success: true,
    message: "Update successfully",
    data: data,
    childrenParentUpdate,
  });
});

const deleteData = catchAsyncError(async (req, res, next) => {
  console.log("deleteData function is working");
  let data = await sparePartsSkuModel.findById(req.params.id);
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