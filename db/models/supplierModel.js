const mongoose = require("mongoose");
const validator = require("validator");

const supplierSchema = mongoose.Schema({
  supplier_id: {
    type: String,
    required: [true, "Please enter supplier id"],
  },
  name: {
    type: String,
    required: [true, "Please enter supplier name"],
    trim: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: [true, "Please enter mobile no"],
    minLength: [11, "Mobile can not less than 11 characters"],
    maxLength: [11, "Mobile can not exceed 11 characters"],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    // validate: [validator.isEmail, "Please Enter a valid Email"],
    trim: true,
    // unique: true,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
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
    default: "Admin",
  },
  created_at: { type: Date, default: Date.now },
  updated_by: {
    type: String,
    trim: true,
    default: "N/A",
  },
  updated_at: { type: Date, default: Date.now },
});
supplierSchema.index({ name: 1 });
supplierSchema.index({ mobile: 1 });
const supplierModel = mongoose.model("supplier", supplierSchema);

// const saveData = async () => {
//   let totalData = await supplierModel.countDocuments();
//   console.log("totalData 123456", totalData);
//   if (totalData < 1) {
//     const supDoc = new supplierModel({
//       supplier_id: "s100",
//       name: "Primary",
//       mobile: "01645499001",
//       email: "sup@gmail.com",
//     });
//     await supDoc.save();
//   }
// };
// saveData();

module.exports = supplierModel;
