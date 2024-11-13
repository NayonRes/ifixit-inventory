const mongoose = require("mongoose");
const validator = require("validator");

const customerSchema = mongoose.Schema({
  customer_id: {
    type: String,
    required: [true, "Please enter customer id"],
  },
  name: {
    type: String,
    required: [true, "Please enter customer name"],
    trim: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: [true, "Please enter mobile no"],
    maxLength: [14, "Mobile cannot exceed 14 characters"],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please Enter a valid Email"],
    trim: true,
    unique: true,
    default: null,
  },
  customer_type: {
    type: String,
    default: null,
  },
  rating: {
    type: String,
    default: null,
  },
  membership_id: {
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
customerSchema.index({ name: 1 });
customerSchema.index({ mobile: 1 });
const customerModel = mongoose.model("customer", customerSchema);

const saveData = async () => {
  let totalData = await customerModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const custDoc = new customerModel({
      customer_id: "cus100",
      name: "Primary",
      mobile: "01645499001",
      email: "cus@gmail.com",
    });
    await custDoc.save();
  }
};
// saveData();

module.exports = customerModel;
