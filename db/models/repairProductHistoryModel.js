const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairProductHistorySchema = mongoose.Schema({
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repair",
    required: [true, "Please select a repairId"],
  },
  product_details: [
    {
      product_id: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: [true, "Please enter product Id"],
      },
      product_variation_id: {
        type: Schema.Types.ObjectId,
        ref: "product_variation",
        required: [true, "Please enter product Id"],
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        default: 0,
      },
      remarks: {
        type: String,
      },
    },
  ],
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

repairProductHistorySchema.index({ repair_id: 1 });
const repairProductHistoryModel = mongoose.model(
  "repair_product_history",
  repairProductHistorySchema
);

module.exports = repairProductHistoryModel;
