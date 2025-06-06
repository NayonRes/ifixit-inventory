const jwt = require("jsonwebtoken");
const sendToken = (user, branchInfo, statusCode, res) => {
  console.log("user---------------", user);

  // const token = user.getJWTToken();

  // options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Cookie is accessible only by the web server
    secure: process.env.NODE_ENV === "production" ? true : false, // Cookie sent only over HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site, 'lax' for same-site
    // domain: "https://ifixit-admin-panel.vercel.app", // Allow cookies to be shared across subdomains
  };
  console.log("----------options--------------", options);

  console.log(
    "Running in environment:",
    process.env.NODE_ENV,
    "secure:",
    process.env.NODE_ENV === "production"
  );

  if (process.env.NODE_ENV === "development") {
    console.log("Detailed logging enabled in development.");
  }
  console.log("user===========", user);

  let newUser = {
    _id: user._id,
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
    branch_id: user.branch_id || null,
    is_main_branch: branchInfo?.is_main_branch || null,
    branchInfo: branchInfo || null,

    permission: user.permission || [],
    status: user.status,
  };
  console.log("newUser==============", newUser);

  // const token = jwt.sign({ user: newUser }, process.env.JWT_SECRET, {
  //   expiresIn: "60m",
  // });
  const token = jwt.sign({ user: newUser }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: newUser,
    token,
  });
};

module.exports = sendToken;
