const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  category_id: {
    type: String,
    required: [true, "Please enter category id"],
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
 
const categoryModel = mongoose.model("category", categorySchema);

const saveData = async () => {
  let totalData = await categoryModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const catDoc = new categoryModel({
      category_id: "c100",
      name: "Primary",
      parent_name: "Primary",
    });
    await catDoc.save();
  }
};
saveData();

module.exports = categoryModel;
