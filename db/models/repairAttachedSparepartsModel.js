const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairAttachedSparepartsSchema = mongoose.Schema({
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repairModel",
    required: [true, "Please select repair id"],
  },

  sku_number: {
    type: Number,
    required: [true, "Please select product"],
  },

  remarks: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  is_warranty_claimed_sku: {
    type: Boolean,
    default: false,
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

repairAttachedSparepartsSchema.index({ repair_id: 1 });
const repairAttachedSparepartsModel = mongoose.model(
  "repair_attached_sparepart",
  repairAttachedSparepartsSchema
);

module.exports = repairAttachedSparepartsModel;
