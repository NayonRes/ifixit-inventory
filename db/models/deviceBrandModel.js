const mongoose = require("mongoose");
const { Schema } = mongoose;
const deviceBrandSchema = mongoose.Schema({
  device_brand_id: {
    type: String,
    required: [true, "Please enter device id"],
  },
  name: {
    type: String,
    required: [true, "Please enter device name"],
    trim: true,
    unique: true,
  },
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: "device_brand", // Reference to the brandModel
    default: null,
  },
  image: {
    public_id: {
      type: String,
      // required: true,
    },
    url: {
      type: String,
      // required: true,
    },
  },
  icon: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
    unique: true,
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
deviceBrandSchema.index({ order_no: 1 });
const deviceBrandModel = mongoose.model("device_brand", deviceBrandSchema);

module.exports = deviceBrandModel;
