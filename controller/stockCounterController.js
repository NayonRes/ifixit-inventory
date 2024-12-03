const stockCounterModel = require("../db/models/stockCounterModel");
const ErrorHander = require("../utils/errorHandler");
const mongoose = require("mongoose");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const counterModel = require("../db/models/counterModel");


const getDataWithPagination = catchAsyncError(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    console.log("===========req.query.page", req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    var query = {};

    if (req.query.spare_parts_id) {
        query.category_id = new mongoose.Types.ObjectId(req.query.spare_parts_id);
    }
    if (req.query.spare_parts_variation_id) {
        query.brand_id = new mongoose.Types.ObjectId(req.query.spare_parts_variation_id);
    }
    if (req.query.branch_id) {
        query.device_id = new mongoose.Types.ObjectId(req.query.branch_id);
    }

    let totalData = await stockCounterModel.countDocuments(query);
    console.log("totalData=================================", totalData);
    //const data = await stockCounterModel.find(query).skip(startIndex).limit(limit);

    const data = await stockCounterModel.aggregate([
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
                as: "spare_parts_variation_data",
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
            $project: {
                _id: 1,
                spare_parts_id: 1,
                spare_parts_variation_id: 1,
                branch_id: 1,
                stock_limit: 1,
                remarks: 1,
                status: 1,
                created_by: 1,
                created_at: 1,
                updated_by: 1,
                updated_at: 1,

                "sparepart_data.name": 1,
                "sparepart_data.description": 1,
                "sparepart_data.description": 1,
                "sparepart_data.price": 1,
                "branch_data.name": 1,
                "branch_data.parent_name": 1,
                "spare_parts_variation_data.name": 1,
                "spare_parts_variation_data.price": 1,
                "spare_parts_variation_data.images": 1,
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
    const data = await stockCounterModel.aggregate([
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
                as: "spare_parts_variation_data",
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
                sparePart_id: 1,
                stock_limit: 1,
                remarks: 1,
                status: 1,
                created_by: 1,
                created_at: 1,
                updated_by: 1,
                updated_at: 1,

                "sparepart_data.name": 1,
                "sparepart_data.description": 1,
                "sparepart_data.description": 1,
                "sparepart_data.price": 1,
                "branch_data.name": 1,
                "branch_data.parent_name": 1,
                "spare_parts_variation_data.name": 1,
                "spare_parts_variation_data.price": 1,
                "spare_parts_variation_data.images": 1,
            },
        },
    ]);

    if (!data) {
        return res.send({ message: "No data found", status: 404 });
    }
    res.send({ message: "success", status: 200, data: data });
});


const insertLimit = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    const stock_limit = parseInt(req.body.stock_limit);
    const branch_id = req.body.branch_id;
    const spare_parts_variation_id = req.body.spare_parts_variation_id;
    const existingStock = await stockCounterModel.findOne({
        branch_id,
        spare_parts_variation_id
    });

    if (!existingStock) {
        return res.status(404).send({ message: "stock not found", status: 404 });
    }

    let decodedData = jwt.verify(token, process.env.JWT_SECRET);
    existingStock.stock_limit = stock_limit;
    existingStock.created_by = decodedData?.user?.email;
    const data = await stockCounterModel.updateOne(existingStock);
    res.send({ message: "success", status: 201, data: data });
});


const deleteData = catchAsyncError(async (req, res, next) => {
    console.log("deleteData function is working");
    let data = await stockCounterModel.findById(req.params.id);
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


async function incrementStock(branch_id, spare_parts_variation_id, stock) {
    const stockCounter = parseInt(stock);
    try {
        const existingStock = await stockCounterModel.findOne({
            branch_id,
            spare_parts_variation_id
        });

        if (existingStock) {
            await stockCounterModel.findByIdAndUpdate(
                { _id: mongoose.Types.ObjectId(existingStock._id) },
                { $inc: { total_stock: stockCounter } },
                { upsert: false, new: true }
            );
            console.log(`Total stock for ${branch_id}, ${spare_parts_variation_id}, ${existingStock._id} has been incremented.`);
        } else {
            console.log(`No document found for ${branch_id}, ${spare_parts_variation_id}. No update performed.`);
        }
    } catch (err) {
        console.error('Error updating stock:', err);
    }
}

async function decrementStock(branch_id, spare_parts_variation_id, stock) {
    try {
        const existingStock = await stockCounterModel.findOne({
            branch_id,
            spare_parts_variation_id
        });

        if (existingStock) {
            await stockCounterModel.updateOne(
                { _id: existingStock._id },
                { $inc: { total_stock: -stock } }
            );
            console.log(`Total stock for ${branch_id}, ${spare_parts_variation_id} has been incremented.`);
        } else {
            console.log(`No document found for ${branch_id}, ${spare_parts_variation_id}. No update performed.`);
        }
    } catch (err) {
        console.error('Error updating stock:', err);
    }
}


module.exports = {
    getDataWithPagination,
    getById,
    insertLimit,
    // createData,
    // updateData,
    deleteData,
    incrementStock,
    decrementStock

};
