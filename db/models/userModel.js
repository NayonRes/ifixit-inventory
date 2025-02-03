const mongoose = require("mongoose");
const { Schema } = mongoose;
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: [true, "Please enter user id"],
  },
  name: {
    type: String,
    required: [true, "Please enter name"],
    maxLength: [32, "Name cannot exceed 32 characters"],
    minLength: [4, "Name should have more than 4 characters"],
  },
  designation: {
    type: String,
    required: [true, "Please enter designation"],
    // maxLength: [32, "Name cannot exceed 32 characters"],
    // minLength: [4, "Name should have more than 4 characters"],
  },
  mobile: {
    type: String,
    required: [true, "Please enter mobile number"],
    unique: true,
    // validate: [validator.isEmail, "Please enter mobile number"],
    minLength: [11, "Mobile can not less than 11 characters"],
    maxLength: [11, "Mobile can not exceed 11 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid Email"],
  },

  salary: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
    required: [true, "Please enter Password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },
  permission: Array,
  image: {
    public_id: {
      type: String,
      // required: true,
    },
    url: {
      type: String,
      // required: true,
    },
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branchModel", // Reference to the brandModel
    required: [true, "Please enter select branch"],
  },
  // role_id: {
  //   type: String,
  //   // required: [true, "Please Select A Role"],
  //   // default: "",
  // },

  remarks: {
    type: String,
  },

  status: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: String,
    trim: true,
    // default: "mahnayon@gmail.com",
  },
  created_at: { type: Date, default: Date.now },
  updated_by: {
    type: String,
    trim: true,
    default: "N/A",
  },
  updated_at: { type: Date, default: Date.now },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// schema.pre funtion run before create modal

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// // JWT TOKEN
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// // Compare Password

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// // Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
const user = mongoose.model("User", userSchema);

const permissions = [
  "dashboard",

  // Branch
  "branch_list",
  "add_branch",
  "update_branch",
  "view_branch_details",
  "branch_dropdown_list",

  // Brand
  "brand_list",
  "add_brand",
  "update_brand",
  "view_brand_details",
  "brand_dropdown_list",

  // Category
  "category_list",
  "add_category",
  "update_category",
  "view_category_details",
  "category_dropdown_list",

  // Customer
  "customer_list",
  "add_customer",
  "update_customer",
  "view_customer_details",
  "customer_dropdown_list",

  // Device
  "device_list",
  "add_device",
  "update_device",
  "view_device_details",
  "device_dropdown_list",

  // Product
  "product_list",
  "add_product",
  "update_product",
  "view_product_details",
  "product_dropdown_list",

  // Purchase
  "purchase_list",
  "add_purchase",
  "view_purchase_details",
  "purchase_dropdown_list",

  // Model
  "model_list",
  "add_model",
  "update_model",
  "view_model_details",
  "model_dropdown_list",

  // Order
  "order_list",
  "place_order",
  "cancel_order",
  "view_order_details",
  "order_dropdown_list",

  // Role
  "role_list",
  "add_role",
  "update_role",
  "view_role_details",
  "role_dropdown_list",

  // Spare Parts
  "spare_parts_list",
  "add_spare_part",
  "update_spare_part",
  "view_spare_part_details",
  "spare_parts_dropdown_list",

  // Supplier
  "supplier_list",
  "add_supplier",
  "update_supplier",
  "view_supplier_details",
  "supplier_dropdown_list",

  // User
  "user_list",
  "add_user",
  "update_user",
  "view_user_details",
  "user_dropdown_list",

  // Stock
  "stock_list",
  "add_stock",
  "update_stock",
  "view_stock_details",
  "stock_dropdown_list",

  // Repair
  "repair_list",
  "add_repair",
  "update_repair",
  "view_repair_details",
  "repair_dropdown_list",

  // Service
  "service_list",
  "add_service",
  "update_service",
  "view_service_details",
  "service_dropdown_list",

  // Blog
  "blog_list",
  "add_blog",
  "update_blog",
  "view_blog_details",
  "blog_dropdown_list",
];
const permissions2 = [
  "dashboard",

  // Branch
  "branch_list",
  "add_branch",
  "update_branch",
  "view_branch_details",
  "branch_dropdown_list",

  // Brand
  "brand_list",
  "add_brand",
  "update_brand",
  "view_brand_details",
  "brand_dropdown_list",

  // Category
  "category_list",
  "add_category",
  "update_category",
  "view_category_details",
  "category_dropdown_list",

  // Customer
  "customer_list",
  "add_customer",
  "update_customer",
  "view_customer_details",
  "customer_dropdown_list",

  // Device
  "device_list",
  "add_device",
  "update_device",
  "view_device_details",
  "device_dropdown_list",

  // Role
  "role_list",
  "add_role",
  "update_role",
  "view_role_details",
  "role_dropdown_list",

  // User
  "user_list",
  "add_user",
  "update_user",
  "view_user_details",
  "user_dropdown_list",
];

let userData = [
  {
    user_id: "u100",
    name: "Admin",
    email: "admin@dg.com",
    designation: "Owner",
    password: "admin12345",
    branch_id: new mongoose.Types.ObjectId(),
    mobile: "01793661517",
    created_by: "Super Admin",
    permission: permissions,
  },
  {
    user_id: "u101",
    name: "User",
    email: "user@dg.com",
    password: "user12345",
    designation: "Employee",
    branch_id: new mongoose.Types.ObjectId(),
    created_by: "Super Admin",
    mobile: "01977096655",
    permission: permissions2,
  },
];
const saveData = async () => {
  let totalData = await user.countDocuments();
  console.log("totalData 123456", totalData);

  if (totalData < 1) {
    for (let index = 0; index < userData.length; index++) {
      const element = userData[index];

      console.log("element", element);

      const userDoc = new user(element);
      await userDoc.save();
    }
  }
};
saveData();
