const sharp = require("sharp");
const cloudinary = require("../utils/cloudinary");

const base64ImageUpload = async (base64Images, folderName, next) => {
  let imageData = [];

  // Ensure the input is always an array
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  if (images.length > 5) {
    return next(new ErrorHander("Max 5 images can be uploaded", 400));
  }

  for (let index = 0; index < images.length; index++) {
    const base64String = images[index];

    try {
      // Validate and extract Base64 image data
      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return next(new ErrorHander("Invalid Base64 image data", 400));
      }

      const buffer = Buffer.from(matches[2], "base64"); // Convert Base64 to Buffer

      // Resize the image using Sharp
      const resizedBuffer = await sharp(buffer).resize(800, 600).toBuffer();

      // Upload the resized image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: folderName },
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            }
          )
          .end(resizedBuffer);
      });

      // Collect the uploaded image data
      imageData.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error(error);
      return next(new ErrorHander("Image upload failed", 500));
    }
  }

  return imageData; // Return the uploaded image data
};

module.exports = base64ImageUpload;