const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairServiceHistorySchema = mongoose.Schema({
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repair",
    required: [true, "Please select a repairId"],
  },


  service_info: [
    {
      service_id: {
        type: Schema.Types.ObjectId,
        ref: "service",
        required: [true, "Please enter select model"],
      },
      name: {
        type: String,
      },
      repair_cost: {
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

repairServiceHistorySchema.index({ repair_id: 1 });
const repairServiceHistoryModel = mongoose.model(
  "repair_service_history",
  repairServiceHistorySchema
);

module.exports = repairServiceHistoryModel;
