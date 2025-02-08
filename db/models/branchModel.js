const mongoose = require("mongoose");

const branchSchema = mongoose.Schema({
  branch_id: {
    type: String,
    required: [true, "Please enter branch id"],
  },
  name: {
    type: String,
    required: [true, "Please enter branch name"],
    trim: true,
    unique: true,
  },
  parent_name: {
    type: String,
    // default: 10000,
    required: [true, "Please enter parent name"],
  },
  remarks: {
    type: String,
  },
  is_main_branch: {
    type: Boolean,
    default: false,
  },
  off_day: {
    type: String,
  },
  phone_no_1: {
    type: String,
    // required: [true, "Please enter phone number"],
    minLength: [11, "Mobile can not less than 11 characters"],
    maxLength: [11, "Mobile can not exceed 11 characters"],
  },
  phone_no_2: {
    type: String,
    minLength: [11, "Mobile can not less than 11 characters"],
    maxLength: [11, "Mobile can not exceed 11 characters"],
  },
  address: {
    type: String,
    // required: [true, "Please enter address"],
  },
  image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  map_image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
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
branchSchema.index({ name: 1 });
const branchModel = mongoose.model("branch", branchSchema);

const saveData = async () => {
  let totalData = await branchModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const branchDoc = new branchModel({
      branch_id: "b100",
      name: "IFIXIT",
      parent_name: "IFIXIT",
      is_main_branch: true,
    });
    await branchDoc.save();
  }
};
saveData();

module.exports = branchModel;
