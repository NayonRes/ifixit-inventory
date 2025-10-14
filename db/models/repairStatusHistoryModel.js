const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairStatusHistorySchema = mongoose.Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "userModel",
    required: [true, "Please select user"],
  },
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repairModel",
    required: [true, "Please select a repairId"],
  },
  warranty_id: {
    type: Schema.Types.ObjectId,
    ref: "warrantyModel",
    default: null,
  },
  repair_status_name: {
    type: String,
    required: [true, "Please enter Status"],
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

repairStatusHistorySchema.index({ repair_id: 1 });
const repairStatusHistoryModel = mongoose.model(
  "repair_status_history",
  repairStatusHistorySchema
);

module.exports = repairStatusHistoryModel;
