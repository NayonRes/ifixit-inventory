const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockSchema = mongoose.Schema({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: "product",
    required: [true, "Please select product"],
  },
  product_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "product_variation",
    required: [true, "Please select product variation"],
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branch",
    required: [true, "Please select branch"],
  },
  purchase_branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branch",
    required: [true, "Please select purchase branch"],
  },
  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchase",
    required: [true, "Please select purchase"],
  },
  purchase_product_id: {
    type: Schema.Types.ObjectId,
    ref: "purchase_product",
    required: [true, "Please select purchase product"],
  },

  supplier_id: {
    type: Schema.Types.ObjectId,
    ref: "supplier", // Reference to the brandModel
    required: [true, "Please select supplier"],
  },

  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "brand", // Reference to the brandModel
    required: [true, "Please enter select brand"],
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: "category",
    required: [true, "Please enter select category"],
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: "device",
    required: [true, "Please enter select device"],
  },
  model_id: {
    type: Schema.Types.ObjectId,
    ref: "model",
    required: [true, "Please enter select model"],
  },
  sku_number: {
    type: Number,
    unique: true,
  },
  stock_status: {
    type: String,
    enum: ["Attached", "Returned", "Available", "Abnormal", "Sold"],
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
stockSchema.index({ sku_number: 1 });
stockSchema.index({ product_id: 1 });
const stockModel = mongoose.model("stock", stockSchema);

module.exports = stockModel;
