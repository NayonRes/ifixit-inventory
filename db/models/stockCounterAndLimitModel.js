const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockCounterAndLimitSchema = mongoose.Schema({
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
