const fs = require("fs/promises");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ErrorHandler = require("../utils/errorHandler");
// const { fromIni } = require("@aws-sdk/credential-providers");

// 🔧 AWS S3 setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

const imageUpload = async (images, folderName, next) => {
  try {
    let myFiles = [];

    if (Array.isArray(images)) {
      myFiles = images;
    } else if (typeof images === "object") {
      myFiles = [images];
    }

    if (myFiles.length > 5) {
      return next(new ErrorHandler("Max 5 images can be uploaded", 400));
    }

    const imageData = [];

    for (const file of myFiles) {
      const fileExt = file.mimetype.split("/")[1].toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(`.${fileExt}`)) {
        return next(
          new ErrorHandler("Image type must be svg, png, jpg, jpeg, or webp", 400)
        );
      }

      // 🧾 Read the temp file into a buffer
      const rawBuffer = await fs.readFile(file.tempFilePath);

      // 🧪 Process with sharp
      const buffer = await sharp(rawBuffer).toBuffer();

      const uniqueId = uuidv4();
      const fileName = `${folderName}/${uniqueId}.${fileExt}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.mimetype,
        // ACL: "public-read",
      };

      await s3.send(new PutObjectCommand(params));

      imageData.push({
        public_id: fileName, // Public ID (S3 Key)
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      });

      // 🧹 Clean up temp file
      fs.unlink(file.tempFilePath).catch((err) =>
        console.error("Failed to delete temp file:", err)
      );
    }

    return imageData;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return next(new ErrorHandler("Image upload failed", 500));
  }
};

module.exports = imageUpload;
