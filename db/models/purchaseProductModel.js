const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseProductSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter purchaseProduct name"],
    trim: true,
  },
  spare_part_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartVariationModel",
    required: [true, "Please enter Spare part Id"],
  },
  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseModel",
    required: [true, "Please enter purchase Id"],
  },
  quantity: {
    type: Number,
    default:0
  },
  unit_price: {
    type: Number,
    default:0
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
purchaseProductSchema.index({ name: 1 });
const purchaseProductModel = mongoose.model("purchaseProduct", purchaseProductSchema);

const saveData = async () => {
  let totalData = await purchaseProductModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const purchaseProductDoc = new purchaseProductModel({
      name: "Primary",
    });
    await purchaseProductDoc.save();
  }
};
// saveData();

module.exports = purchaseProductModel;
