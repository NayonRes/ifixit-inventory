const mongoose = require("mongoose");
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
    maxLength: [14, "Name cannot exceed 14 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid Email"],
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
    type: String,
    required: [true, "Please select branch"],
    // default: "",
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

let permissions = [
  "per100",
  "per101",
  "per102",
  "per103",
  "per104",
  "per105",
  "per106",
  "per107",
  "per108",
  "per109",
  "per110",
  "per111",
  "per112",
  "per113",
  "per114",
  "per115",
  "per116",
  "per117",
  "per118",
  "per119",
  "per120",
  "per121",
  "per122",
  "per123",
  "per124",
  "per125",
  "per126",
  "per127",
  "per128",
  "per129",
  "per130",
  "per131",
  "per132",
  "per133",
  "per134",
  "per135",
  "per136",
  "per137",
  "per138",
  "per139",
  "per140",
  "per141",
  "per142",
  "per143",
  "per144",
  "per145",
  "per146",
  "per147",
];
let permissions2 = [
  "per100",
  "per101",
  "per102",
  "per103",
  "per104",
  "per105",
  "per106",
  "per107",
  "per108",
  "per109",
  "per110",
  "per111",
  "per112",
  "per113",
  "per114",
  "per115",
  "per116",
  "per117",
];

let userData = [
  {
    user_id: "u100",
    name: "Admin",
    email: "admin@dg.com",
    designation: "Owner",
    password: "admin12345",
    branch_id: "thisIsIntialdata",
    mobile: "+8801793661517",
    created_by: "Super Admin",
    permission: permissions,
  },
  {
    user_id: "u101",
    name: "User",
    email: "user@dg.com",
    password: "user12345",
    designation: "Employee",
    branch_id: "thisIsIntialdata",
    created_by: "Super Admin",
    mobile: "+8801977096655",
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
