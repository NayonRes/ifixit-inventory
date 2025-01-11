const mongoose = require("mongoose");
const { Schema } = mongoose;

const sparePartsStockSchema = mongoose.Schema({
  spare_parts_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsModel",
    required: [true, "Please select spare parts"],
  },
  spare_parts_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsVariationModel",
    required: [true, "Please select spare parts variation"],
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branchModel",
    required: [true, "Please select branch"],
  },
  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseModel",
    required: [true, "Please select purchase"],
  },
  purchase_product_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseProductModel",
    required: [true, "Please select purchase product"],
  },

  supplier_id: {
    type: Schema.Types.ObjectId,
    ref: "supplierModel", // Reference to the brandModel
    required: [true, "Please select supplier"],
  },

  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "brandModel", // Reference to the brandModel
    required: [true, "Please enter select brand"],
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: "categoryModel",
    required: [true, "Please enter select category"],
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: "deviceModel",
    required: [true, "Please enter select device"],
  },
  model_id: {
    type: Schema.Types.ObjectId,
    ref: "modelModel",
    required: [true, "Please enter select model"],
  },
  sku_number: {
    type: Number,
    unique: true,
  },
  stock_status: {
    type: String,
    default: "Available",
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
sparePartsStockSchema.index({ sku_number: 1 });
sparePartsStockSchema.index({ spare_parts_id: 1 });
const sparePartsStockModel = mongoose.model(
  "spare_Parts_stock",
  sparePartsStockSchema
);

module.exports = sparePartsStockModel;
