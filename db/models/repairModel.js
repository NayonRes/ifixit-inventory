const mongoose = require("mongoose");
const { Schema } = mongoose;

const repairSchema = mongoose.Schema({
  repair_id: {
    type: String,
    required: [true, "Please enter serial"],
  },
  serial: {
    type: String,
    // required: [true, "Please enter serial"],
    default: null,
  },
  pass_code: {
    type: String,
    // required: [true, "Please enter pass code"],
    default: null,
  },
  // it is originally  device_id. For repair module device under primary device list is product brand list
  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "deviceModel",
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
    // required: [true, "Please enter payment status"],
  },
  repair_by: {
    type: Schema.Types.ObjectId,
    ref: "userModel",
    default: null,
    set: (v) => (v === "" ? null : v),
    // required: [true, "Please enter select brand"],
  },
  repair_status: {
    type: String,
    // required: [true, "Please enter repair status"],
  },

  issues: [
    {
      service_id: {
        type: Schema.Types.ObjectId,
        ref: "serviceModel",
        required: [true, "Please enter select model"],
      },
      name: {
        type: String,
      },
      repair_cost: {
        type: Number,
        default: 0,
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
    },
  ],
  product_details: [
    {
      product_id: {
        type: Schema.Types.ObjectId,
        ref: "productModel",
        required: [true, "Please enter product Id"],
      },
      product_variation_id: {
        type: Schema.Types.ObjectId,
        ref: "productVariationModel",
        required: [true, "Please enter product Id"],
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        default: 0,
      },
    },
  ],
  stock_sku: {
    type: Array,
  },
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
    checklist: [
      // {
      //   name: { type: String }, // Ensure 'key' is a string and required
      //   status: { type: String }, // Ensure 'isFunctional' is a boolean and required
      // },

      {
        name: { type: String },
        model_id: { type: Schema.Types.ObjectId, ref: "issueModel" },
        status: { type: String },
        // required: [true, "Please select at least one issue"],
      },
    ],
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
