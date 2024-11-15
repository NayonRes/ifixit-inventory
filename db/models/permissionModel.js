const mongoose = require("mongoose");
const PermissionData = require("../../initial-data/PermissionData");

const permissionSchema = mongoose.Schema({
  permission_id: {
    type: String,
    required: [true, "Please enter permission id"],
  },
  name: {
    type: String,
    required: [true, "Please enter permission display name"],
    trim: true,
    unique: true,
  },
  permission_name: {
    type: String,
    unique: true,
    // default: 10000,
    required: [true, "Please enter permission name"],
  },
  order_no: {
    type: Number,
    required: [true, "Please enter permission module name"],
  },
  module_name: {
    type: String,
    // default: 10000,
    required: [true, "Please enter permission module name"],
  },
  // category_id: {
  //   type: Array,
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

const permissionModel = mongoose.model("permission", permissionSchema);

const saveData = async () => {
  // console.log("PermissionData", PermissionData);
  let totalData = await permissionModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    for (let index = 0; index < PermissionData.length; index++) {
      const element = PermissionData[index];

      const permissionDoc = new permissionModel({
        permission_id: element.permission_id,
        name: element.name,
        order_no: element.order_no,
        permission_name: element.permission_name,
        module_name: element.module_name,
      });
      await permissionDoc.save();
    }
  }
};
saveData();

module.exports = permissionModel;
