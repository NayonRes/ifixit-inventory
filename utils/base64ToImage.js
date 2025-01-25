
const fs = require('fs');
const path = require('path');
const ErrorHander = require("../utils/errorHandler");

const base64ToImage = (base64String, outputDirectory = 'tmp') => {
    if (!base64String || typeof base64String !== 'string') {
        return next(new ErrorHander("Base64 string is required", 400));
    }

    const base64Data = base64String.split(',')[1]; // Get only the Base64 part

    if (!base64Data) {
        return next(new ErrorHander("Invalid Base64 string", 400));
    }

    const currentDirectory = __dirname;  // This will return the current directory path

    // Generate a temporary file path using the current timestamp
    const fileName = `tmp-${Date.now()}.jpeg`; // You can adjust the file extension as needed
    const tempFilePath = path.join(currentDirectory, outputDirectory, fileName);

    // Ensure the output directory exists, if not create it
    const outputPath = path.join(currentDirectory, outputDirectory);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    // Write the Base64 data to the file
    try {
        fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
        console.log(`Image saved successfully at ${tempFilePath}`);

        // Return an object with the file path as 'tempFilePath'
        return { tempFilePath };  // Return an object with 'tempFilePath' field
    } catch (error) {
        console.error('Error saving the image:', error);
        return next(new ErrorHander("Failed to save the image", 400));
    }
}

module.exports = { base64ToImage };