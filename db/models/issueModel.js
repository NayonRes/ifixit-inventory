const mongoose = require("mongoose");
const { Schema } = mongoose;

const issueSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter model name"],
    trim: true,
    unique: true,
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
    unique: true,
  },
  model_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "model",
      required: [true, "Please select at least one model"],
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

issueSchema.index({ name: 1 });
issueSchema.index({ order_no: 1 });
const issueModel = mongoose.model("issue", issueSchema);

module.exports = issueModel;
