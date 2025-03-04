const purchaseReturnModel = require("../db/models/purchaseReturnModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    console.log("===========req.query================", req.query);
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    var query = {};
    if (req.query.status) {
        query.status = req.query.status;
    }
    if (req.query.spare_parts_id) {
        query.spare_parts_id = new mongoose.Types.ObjectId(req.query.spare_parts_id);
    }
    if (req.query.spare_parts_variation_id) {
        query.spare_parts_variation_id = new mongoose.Types.ObjectId(req.query.spare_parts_variation_id);
    }
    if (req.query.branch_id) {
        query.branch_id = new mongoose.Types.ObjectId(req.query.branch_id);
    }
    if (req.query.purchase_product_id) {
        query.purchase_product_id = new mongoose.Types.ObjectId(req.query.purchase_product_id);
    }
    if (req.query.supplier_id) {
        query.supplier_id = new mongoose.Types.ObjectId(req.query.supplier_id);
    }

    let totalData = await purchaseReturnModel.countDocuments(query);
    console.log("totalData=================================", totalData);
    // const data = await purchaseReturnModel.find(query).skip(startIndex).limit(limit);

    const data = await purchaseReturnModel.aggregate([
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
                from: "purchaseproducts",
                localField: "purchase_id",
                foreignField: "_id",
                as: "purchaseProduct_data",
            },
        },
        {
            $lookup: {
                from: "suppliers",
                localField: "supplier_id",
                foreignField: "_id",
                as: "supplier_data",
            },
        },
        {
            $project: {
                _id: 1,
                spare_parts_id: 1,
                spare_parts_variation_id: 1,
                branch_id: 1,
                purchase_product_id: 1,
                supplier_id: 1,
                sku_numbers: 1,

                status: 1,
                created_by: 1,
                created_at: 1,
                updated_by: 1,
                updated_at: 1,

                "sparepart_data.name": 1,
                "branch_data.name": 1,
                "sparepartvariation_data.name": 1,
                "purchaseProduct_data.unit_price": 1,
                "supplier_data.name": 1
            },
        },
        {
            $sort: { created_at: -1 },
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

    const data = await purchaseReturnModel.aggregate([
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
                from: "purchaseproducts",
                localField: "purchase_id",
                foreignField: "_id",
                as: "purchaseProduct_data",
            },
        },
        {
            $lookup: {
                from: "suppliers",
                localField: "supplier_id",
                foreignField: "_id",
                as: "supplier_data",
            },
        },
        {
            $project: {
                _id: 1,
                spare_parts_id: 1,
                spare_parts_variation_id: 1,
                branch_id: 1,
                purchase_product_id: 1,
                supplier_id: 1,
                sku_number: 1,

                status: 1,
                created_by: 1,
                created_at: 1,
                updated_by: 1,
                updated_at: 1,

                "sparepart_data.name": 1,
                "branch_data.name": 1,
                "sparepartvariation_data.name": 1,
                "purchaseProduct_data.unit_price": 1,
                "supplier_data.name": 1
            },
        },
    ]);

    if (!data || data.length === 0) {
        return next(new ErrorHander("No data found", 404));
    }

    res.status(200).json({
        success: true,
        message: "success",
        data: data[0], // Access the first (and only) document in the array
    });
});

const createData = catchAsyncError(async (req, res, next) => {
    console.log("req.files--------", req.files);
    console.log("req.body------------", req.body);

    const { token } = req.cookies;

    let decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let newData = {
        ...req.body,
        created_by: decodedData?.user?.email,
    };
    console.log("newData", newData);
    const data = await purchaseReturnModel.create(newData);
    res.send({ message: "success", status: 201, data: data });
});

const updateData = async (req, res, next) => {
   

    try {
        const { token } = req.cookies;
        let data = await purchaseReturnModel.findById(req.params.id);

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
        console.log("newData", newData);
        let updateData = await purchaseReturnModel.findByIdAndUpdate(
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
            data: updateData,
        });
    } catch (error) {
        console.log("error", error);
        res.send({ message: "error", status: 400, error: error });
    }
};

const deleteData = catchAsyncError(async (req, res, next) => {

    let data = await purchaseReturnModel.findById(req.params.id);
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
