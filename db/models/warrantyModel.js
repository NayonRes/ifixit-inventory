const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockSchema = mongoose.Schema({
  warranty_id: {
    type: String,
    required: [true, "Please enter serial"],
  },
  repair_id: {
    type: Schema.Types.ObjectId,
    ref: "repairModel",
    required: [true, "Please select repair id"],
  },
  service_charge: {
    type: Number,
    required: [true, "Please enter service charge"],
  },

  repair_by: {
    type: Schema.Types.ObjectId,
    ref: "userModel",
    default: null,
    set: (v) => (v === "" ? null : v),
    // required: [true, "Please enter select brand"],
  },
  delivery_status: {
    type: String,
  },
  due_amount: {
    type: Number,
    default: 0,
  },
  discount_amount: {
    type: Number,
    default: 0,
  },
  // payment_status: {
  //   type: String,
  //   // required: [true, "Please enter payment status"],
  // },

  payment_info: [
    {
      name: {
        type: String,
      },
      amount: {
        type: Number,
        default: 0,
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

stockSchema.index({ repair_id: 1 });
const warrantyModel = mongoose.model("warranty", stockSchema);

module.exports = warrantyModel;
