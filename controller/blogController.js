const blogModel = require("../db/models/blogModel");
const ErrorHander = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const jwt = require("jsonwebtoken");
const imageUpload = require("../utils/imageUpload");
const imageDelete = require("../utils/imageDelete");

const getDataWithPagination = catchAsyncError(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    console.log("===========req.query.page", req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    var query = {};
    if (req.query.order_id) {
        query.order_id = parseInt(req.query.order_id);
    }
    if (req.query.blog_title) {
        query.order_blog_title = new RegExp(`^${req.query.blog_title}$`, "i");
    }
    if (req.query.blog_sub_title) {
        query.blog_sub_title = new RegExp(`^${req.query.blog_sub_title}$`, "i");
    }
    if (req.query.status) {
        query.status = req.query.status;
    }
    let totalData = await blogModel.countDocuments(query);
    console.log("totalData=================================", totalData);
    const data = await blogModel.find(query).sort({ order_id: 1 }).skip(startIndex).limit(limit);
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
    let data = await blogModel.findById(req.params.id);
    if (!data) {
        return res.send({ message: "No data found", status: 404 });
    }
    res.send({ message: "success", status: 200, data: data });
});

const createData = catchAsyncError(async (req, res, next) => {
    console.log("req.files", req.files);
    const { token } = req.cookies;

    let writerImageData = [];
    let thumbnailImageData = [];
    let image1Data = [];
    let image2Data = [];

    if (req.files) {
        if (req.files.writer_image) {
            writerImageData = await imageUpload(req.files.writer_image, "blog", next);
        }
        if (req.files.thumbnail_image) {
            thumbnailImageData = await imageUpload(req.files.thumbnail_image, "blog", next);
        }
        if (req.files.image_1) {
            image1Data = await imageUpload(req.files.image_1, "blog", next);
        }
        if (req.files.image_2) {
            image2Data = await imageUpload(req.files.image_2, "blog", next);
        }
    }

    console.log("writerImageData", writerImageData);
    console.log("thumbnailImageData", thumbnailImageData);
    console.log("image1Data", image1Data);
    console.log("image2Data", image2Data);

    let decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let newData = {
        ...req.body,
        writer_image: writerImageData[0],
        thumbnail_image: thumbnailImageData[0],
        image_1: image1Data[0],
        image_2: image2Data[0],
        created_by: decodedData?.user?.email,
    };

    const data = await blogModel.create(newData);
    res.send({ message: "success", status: 201, data: data });
});

const updateData = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;

    let data = await blogModel.findById(req.params.id);

    if (!data) {
        console.log("if");
        return next(new ErrorHander("No data found", 404));
    }
    let decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let newData = req.body;
    let writerImageData = [];
    let thumbnailImageData = [];
    let image1Data = [];
    let image2Data = [];

    if (req.files) {
        if (req.files.writer_image) {
            writerImageData = await imageUpload(req.files.writer_image, "blog", next);
        }
        if (req.files.thumbnail_image) {
            thumbnailImageData = await imageUpload(req.files.thumbnail_image, "blog", next);
        }
        if (req.files.image_1) {
            image1Data = await imageUpload(req.files.image_1, "blog", next);
        }
        if (req.files.image_2) {
            image2Data = await imageUpload(req.files.image_2, "blog", next);
        }
    }


    if (writerImageData.length > 0) {
        newData = { ...req.body, writer_image: writerImageData[0] };
    }
    if (data.writer_image.public_id) {
        console.log("previous blog image delete 111111");
        await imageDelete(data.writer_image.public_id, next);
    }

    if (thumbnailImageData.length > 0) {
        newData = { ...req.body, thumbnail_image: thumbnailImageData[0] };
    }
    if (data.thumbnail_image.public_id) {
        console.log("previous blog image delete 111111");
        await imageDelete(data.thumbnail_image.public_id, next);
    }

    if (image1Data.length > 0) {
        newData = { ...req.body, image_1: image1Data[0] };
    }
    if (data.image_1.public_id) {
        console.log("previous blog image delete 111111");
        await imageDelete(data.image_1.public_id, next);
    }

    if (image2Data.length > 0) {
        newData = { ...req.body, image_2: image2Data[0] };
    }
    if (data.image_2.public_id) {
        console.log("previous blog image delete 111111");
        await imageDelete(data.image_2.public_id, next);
    }


    newData = {
        ...newData,
        updated_by: decodedData?.user?.email,
        updated_at: new Date(),
    };

    console.log("newData", newData);

    data = await blogModel.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModified: false,
    });
    res.status(200).json({
        success: true,
        message: "Update successfully",
        data: data,
    });
});

const deleteData = catchAsyncError(async (req, res, next) => {
    console.log("deleteData function is working");
    let data = await blogModel.findById(req.params.id);
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
