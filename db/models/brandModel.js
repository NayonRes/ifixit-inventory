const mongoose = require("mongoose");

const brandSchema = mongoose.Schema({
  brand_id: {
    type: String,
    required: [true, "Please enter brand id"],
  },
  name: {
    type: String,
    required: [true, "Please enter brand name"],
    trim: true,
    unique: true,
  },
  // parent_name: {
  //   type: String,
  //   // default: 10000,
  //   required: [true, "Please enter parent name"],
  // },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "brand",
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
brandSchema.index({ name: 1 });
const brandModel = mongoose.model("brand", brandSchema);

const saveData = async () => {
  let totalData = await brandModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const brandDoc = new brandModel({
      brand_id: "br100",
      name: "Primary",
      parent_name: "Primary",
    });
    await brandDoc.save();
  }
};
// saveData();

module.exports = brandModel;
