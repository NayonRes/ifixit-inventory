const mongoose = require("mongoose");

const deviceSchema = mongoose.Schema({
  device_id: {
    type: String,
    required: [true, "Please enter device id"],
  },
  name: {
    type: String,
    required: [true, "Please enter device name"],
    trim: true,
    unique: true,
  },
  parent_name: {
    type: String,
    // default: 10000,
    // required: [true, "Please enter parent name"],
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

const deviceModel = mongoose.model("device", deviceSchema);

const saveData = async () => {
  let totalData = await deviceModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const deviceDoc = new deviceModel({
      device_id: "d100",
      name: "Primary",
      parent_name: "Primary",
    });
    await deviceDoc.save();
  }
};
// saveData();

module.exports = deviceModel;
