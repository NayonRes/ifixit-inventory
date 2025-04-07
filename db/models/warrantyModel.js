const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockSchema = mongoose.Schema({
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repairModel",
    required: [true, "Please select repair id"],
  },
  service_charge: {
    type: Number,
    required: [true, "Please enter service charge"],
  },
  discount: {
    type: Number,
    default: 0,
  },

  warranty_service_status: {
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

stockSchema.index({ repair_id: 1 });
const warrantyModel = mongoose.model("warranty", stockSchema);

module.exports = warrantyModel;
