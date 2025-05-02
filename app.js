var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const conntectDB = require("./db/database");
// Routes Imports
var indexRouter = require("./routes/index");
var userRouter = require("./routes/userRoute");
var productRouter = require("./routes/productRoute");
var categoryRouter = require("./routes/categoryRoute");
var filterRouter = require("./routes/filterRoute");
var branchRouter = require("./routes/branchRoute");
var brandRouter = require("./routes/brandRoute");
// var blogRouter = require("./routes/blogRoute");
var modelRouter = require("./routes/modelRoute");
var deviceRouter = require("./routes/deviceRoute");
var deviceBrandRouter = require("./routes/deviceBrandRoute");
var customerRouter = require("./routes/customerRoute");
var supplierRouter = require("./routes/supplierRoute");
var purchaseRouter = require("./routes/purchaseRoute");
var productVariationRouter = require("./routes/productVariationRoute");
var purchaseProductRouter = require("./routes/purchaseProductRoute");
var stockRouter = require("./routes/stockRoute");
var repairAttachedSparepartsRouter = require("./routes/repairAttachedSparepartsRoute");
var stockCounterAndLimitRouter = require("./routes/stockCounterAndLimitRoute");
var transferStockRouter = require("./routes/transferStockRoute");
var repairRouter = require("./routes/repairRoute");
var repairStatusHistoryRouter = require("./routes/repairStatusHistoryRoute");
var serviceRouter = require("./routes/serviceRoute");
// var purchaseReturnRouter = require("./routes/purchaseReturnRoute");
var orderRouter = require("./routes/orderRoute");
var permissionRouter = require("./routes/permissionRoute");
var warrantyRouter = require("./routes/warrantyRoute");

const errorMiddleware = require("./middleware/error");
// Database connection

conntectDB();

var app = express();

var whitelist = [
  "https://digital-shop-backend.onrender.com",
  "https://digital-shop-admin-panel.vercel.app",
  "https://ifixit-admin-panel.vercel.app",
  "https://ifixit-website.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];
var corsOptions = {
  // origin: "https://digital-shop-backend.onrender.com",

  origin: function (origin, callback) {
    console.log("origin", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionSuccessStatus: 200,
};
// app.use(cors());

app.use(cors(corsOptions));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload({ useTempFiles: true }));
app.use("/", indexRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/filter", filterRouter);
app.use("/api/v1/branch", branchRouter);
app.use("/api/v1/brand", brandRouter);
// app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/model", modelRouter);
app.use("/api/v1/device", deviceRouter);
app.use("/api/v1/deviceBrand", deviceBrandRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/supplier", supplierRouter);
app.use("/api/v1/purchase", purchaseRouter);
app.use("/api/v1/productVariation", productVariationRouter);
app.use("/api/v1/stock", stockRouter);
// app.use("/api/v1/purchaseReturn", purchaseReturnRouter);
app.use("/api/v1/stockCounterAndLimit", stockCounterAndLimitRouter);
app.use("/api/v1/transferStock", transferStockRouter);
app.use("/api/v1/purchaseProduct", purchaseProductRouter);
app.use("/api/v1/repair", repairRouter);
app.use("/api/v1/repairAttachedSpareparts", repairAttachedSparepartsRouter);
app.use("/api/v1/repairStatusHistory", repairStatusHistoryRouter);
app.use("/api/v1/service", serviceRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/permission", permissionRouter);
app.use("/api/v1/warranty", warrantyRouter);

// catch 404 and forward to error handler
app.use(errorMiddleware);
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
