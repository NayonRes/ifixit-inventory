const ErrorHander = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
let User = require("../db/models/userModel");
const { logout } = require("../controller/userController");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  console.log("isAuthenticatedUser Middleware executed");

  const { token } = req.cookies;

  // console.log("isAuthenticatedUser=================", token);

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }
  console.log("isAuthenticatedUser Middleware executed 1111111111111111");
  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ErrorHander("Invalid or expired token", 401));
  }
  // console.log("decodedData", decodedData);

  req.user = await User.findById(decodedData.user._id);

  // console.log("User found:", req.user);
  if (!req.user.status) {
    // logout();
    return next(new ErrorHander("Your account has been deactivated", 401));
  }

  next();
});

exports.authorizeRoles = (permission) => {
  return (req, res, next) => {
    const { token } = req.cookies;
    let decodedData;
    try {
      decodedData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new ErrorHander("Invalid or expired token", 401));
    }
    // console.log("authorizeRoles Middleware executed");
    // console.log("permission", permission);

    // console.log("req.user.role", decodedData.user.permission);

    let hasPermission = decodedData.user.permission.includes(permission);

    console.log("hasPermission", hasPermission);
    if (!hasPermission) {
      console.log("You don't have the permission");

      return next(
        new ErrorHander("You are not allowed to access this resouce", 403)
      );
    }

    next();
  };
};
