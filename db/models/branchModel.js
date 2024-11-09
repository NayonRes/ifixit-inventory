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

const branchModel = mongoose.model("branch", branchSchema);

const saveData = async () => {
  let totalData = await branchModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const branchDoc = new branchModel({
      branch_id: "b100",
      name: "IFIXIT",
      parent_name: "IFIXIT",
    });
    await branchDoc.save();
  }
};
saveData();

module.exports = branchModel;
