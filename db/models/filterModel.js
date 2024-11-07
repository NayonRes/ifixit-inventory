const mongoose = require("mongoose");

const filterSchema = mongoose.Schema({
  filter_id: {
    type: String,
    required: [true, "Please enter filter id"],
  },
  name: {
    type: String,
    required: [true, "Please enter filter name"],
    trim: true,
    unique: true,
  },
  parent_name: {
    type: String,
    // default: 10000,
    required: [true, "Please enter parent name"],
  },
  category_id: {
    type: Array,
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

const filterModel = mongoose.model("filter", filterSchema);

const saveData = async () => {
  let totalData = await filterModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const filterDoc = new filterModel({
      filter_id: "f100",
      name: "Primary",
      parent_name: "Primary",
    });
    await filterDoc.save();
  }
};
saveData();

module.exports = filterModel;
