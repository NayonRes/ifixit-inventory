const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
  location_id: {
    type: String,
    required: [true, "Please enter location id"],
  },
  name: {
    type: String,
    required: [true, "Please enter category name"],
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

const locationModel = mongoose.model("location", locationSchema);

const saveData = async () => {
  let totalData = await locationModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const locDoc = new locationModel({
      location_id:"l100",
      name: "Primary",
      parent_name: "Primary",
    });
    await locDoc.save();
  }
};
saveData();

module.exports = locationModel;
