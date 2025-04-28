// module.exports = (theFunc) => (req, res, next) => {
//   Promise.resolve(theFunc(req, res, next)).catch(next);
// };

module.exports = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next)).catch((error) => {
    // Handle Duplicate Key Errors (MongoDB E11000)
    if (error.code === 11000) {
      // const duplicateField = Object.keys(error.keyPattern)[0]; // Get which field caused duplicate error

      const duplicateField = Object.keys(error.keyValue)[0]; // Get field name (e.g., "email" or "order_no")
      const duplicateValue = error.keyValue[duplicateField]; // Get the duplicate value (e.g., "test@example.com")

      // let message = `Duplicate value entered for ${duplicateField}: "${duplicateValue}".`;
      let message = `${duplicateField} already exist.`;
      // Duplicate value entered for mobile: \"01855663322\"."
      // let message = "Duplicate field value entered.";

      // Custom messages for specific fields
      if (duplicateField === "order_no") {
        message = "Order no already exist.";
      } else if (duplicateField === "email") {
        message = "Email already exist.";
      } else if (duplicateField === "mobile") {
        message = "Mobile no already exist.";
      }

      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    // Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle any other errors
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  });
};
