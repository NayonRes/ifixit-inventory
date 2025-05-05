const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const ErrorHandler = require("../utils/errorHandler");
// const { fromIni } = require("@aws-sdk/credential-providers");
// const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

/**
 * Configure AWS S3 instance (v3)
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

// Allowed image extensions
const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

/**
 * Uploads base64 image(s) to AWS S3
 * @param {string|string[]} base64Images - Single or multiple base64 image strings
 * @param {string} folderName - The folder name in S3 to store the images
 * @param {function} next - Express error handler
 * @returns {Promise<Array>} - Array of uploaded image metadata [{ public_id, url }]
 */
const base64ImageUpload = async (base64Images, folderName, next) => {
  try {
    let imageData = [];

    // Ensure the input is always an array
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];

    // 🔐 Validate maximum number of files (max 5 images)
    if (images.length > 5) {
      return next(new ErrorHandler("Max 5 images can be uploaded", 400));
    }

    for (const base64String of images) {
      // 🔍 Validate base64 format
      const matches = base64String.match(
        /^data:image\/([a-zA-Z]+);base64,(.+)$/
      );
      if (!matches || matches.length !== 3) {
        return next(new ErrorHandler("Invalid Base64 image data", 400));
      }

      // Convert Base64 to Buffer
      const buffer = Buffer.from(matches[2], "base64");

      // 🔐 Validate file extension (based on MIME type)
      const fileExt = matches[1].toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(`.${fileExt}`)) {
        return next(
          new ErrorHandler(
            "Image type must be svg, png, jpg, jpeg, or webp",
            400
          )
        );
      }

      // 🆔 Generate unique file name using UUID
      const uniqueId = uuidv4();
      const fileName = `${folderName}/${uniqueId}.${fileExt}`;

      // 📦 S3 upload parameters
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Required: Your S3 bucket name
        Key: fileName, // Required: Path and name in S3
        Body: buffer, // File buffer from base64
        ContentType: `image/${fileExt}`, // MIME type for image
        // ACL: "public-read", // Optional: make file accessible via URL
      };

      // 🚀 Upload image to S3
      const command = new PutObjectCommand(params);
      const uploadResult = await s3.send(command);

      // 📝 Collect uploaded file metadata
      imageData.push({
        public_id: fileName, // Public ID (S3 Key)
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`, // Public URL
      });
    }

    // ✅ Return the array of uploaded image metadata
    return imageData;
  } catch (error) {
    console.error("Base64 Image Upload Error:", error);
    return next(new ErrorHandler("Image upload failed", 500));
  }
};

module.exports = base64ImageUpload;
