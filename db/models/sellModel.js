const mongoose = require("mongoose");
const { Schema } = mongoose;

const sellSchema = mongoose.Schema({
  sell_id: {
    type: String,
    required: [true, "Please enter serial"],
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
      quantity: {
        type: Number,
        default: 0,
      },
    },
  ],

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
const sellModel = mongoose.model("sell", sellSchema);

module.exports = sellModel;
