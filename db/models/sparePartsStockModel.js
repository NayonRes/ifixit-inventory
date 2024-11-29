const mongoose = require("mongoose");
const { Schema } = mongoose;

const sparePartsSkuSchema = mongoose.Schema({
  spare_parts_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsModel"
  },
  spare_parts_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsVariationModel"
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branchModel"
  },
  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseModel"
  },
  sku_number: {
    type: Number,
    unique: true
  },
  sku_status: {
    type: String,
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
sparePartsSkuSchema.index({ name: 1 });
const sparePartsSkuModel = mongoose.model("spare_Parts_stock", sparePartsSkuSchema);


module.exports = sparePartsSkuModel;
