const ErrorHander = require("../utils/errorHandler");
const cloudinary = require("../utils/cloudinary");
const imageDelete = async (publicId,next) => {
  console.log("publicId", publicId);
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(result);
  } catch (error) {
    console.log(error);
    return next(new ErrorHander(error, 400));
  }
};

module.exports = imageDelete;
