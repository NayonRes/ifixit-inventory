const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockCounterAndLimitSchema = mongoose.Schema({
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
  total_stock: {
    type: Number,
    default: 0,
  },
  stock_limit: {
    type: Number,
    default: 0,
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
stockCounterAndLimitSchema.index({ name: 1 });
const stockCounterAndLimitModel = mongoose.model(
  "stock_counter_and_limit",
  stockCounterAndLimitSchema
);

module.exports = stockCounterAndLimitModel;
