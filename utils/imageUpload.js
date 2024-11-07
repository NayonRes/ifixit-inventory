const sizeOf = require("image-size");
const ErrorHander = require("../utils/errorHandler");
const cloudinary = require("../utils/cloudinary");
const sharp = require("sharp");
const imageUpload = async (images, folderName, next) => {
  console.log("images", images);
  let myFiles = [];
  let imageData = [];
  if (images.constructor === Array) {
    console.log("if---------------------------------------");
    myFiles = images;
  } else if (typeof images === "object") {
    console.log("else if---------------------------------------");
    myFiles.push(images);
  }
  if (myFiles.length > 5) {
    return next(new ErrorHander("max 5 images can be uploded", 400));
  }
  console.log("myFiles", myFiles);
  for (let index = 0; index < myFiles.length; index++) {
    console.log("for ------------------------------------");
    const element = myFiles[index];
    const dimensions = sizeOf(element.tempFilePath);
    console.log("dimensions", dimensions);
    console.log(dimensions.width, dimensions.height, dimensions.type);
    if (!["svg", "png", "jpg", "jpeg"].includes(dimensions.type)) {
      return next(new ErrorHander("image type must be svg/png/jpg/jpeg", 400));
    }

    try {
      const buffer = await sharp(element.tempFilePath)
        .resize(800, 600)
        .toBuffer();
      console.log("buffer", buffer);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: folderName,
            },
            (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            }
          )
          .end(buffer);
      });
      console.log(result);
      imageData.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error(error);
    }
  }
  return imageData;
};
module.exports = imageUpload;
