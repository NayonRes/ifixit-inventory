const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairSchema = mongoose.Schema({
  repair_id: {
    type: String,
    required: [true, "Please enter serial"],
  },
  serial: {
    type: String,
    required: [true, "Please enter serial"],
  },
  pass_code: {
    type: String,
    required: [true, "Please enter pass code"],
  },
  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "brandModel",
    required: [true, "Please enter select brand"],
  },
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: "customerModel",
    required: [true, "Please enter select customer"],
  },

  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branchModel",
  },
  model_id: {
    type: Schema.Types.ObjectId,
    ref: "modelModel",
    required: [true, "Please enter select model"],
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
  payment_status: {
    type: String,
    required: [true, "Please enter payment status"],
  },
  repair_by: {
    type: Schema.Types.ObjectId,
    ref: "userModel",
    required: [true, "Please enter select brand"],
  },
  repair_status: {
    type: String,
    required: [true, "Please enter repair status"],
  },

  issues: [
    {
      name: {
        type: String,
      },
      price: {
        type: Number,
        default: 0,
      },
    },
  ],
  repair_checklist: {
    has_power: {
      type: Boolean,
    },
    battery_health: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
    },
    checklist: [String],
  },
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
const repairModel = mongoose.model("repair", repairSchema);

module.exports = repairModel;
