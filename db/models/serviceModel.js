const mongoose = require("mongoose");
const { Schema } = mongoose;

const serviceSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter title"],
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
    // unique: true,
  },
  image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  model_id: {
    type: Schema.Types.ObjectId,
    ref: "modelModel",
    required: [true, "Please enter select model"],
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: "deviceModel",
    required: [true, "Please enter select device"],
  },
  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "brandModel",
  },
  branch_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "branchModel",
    },
  ],
  // customer_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: "customerModel",
  // },
  steps: [
    {
      title: {
        type: String,
      },
      //   sub_title: {
      //     type: String,
      //   },
      details: {
        type: String,
      },
      step_image: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      //   question: {
      //     type: String,
      //   },
      //   answer: {
      //     type: String,
      //   },
    },
  ],

  repair_info: [
    {
      name: {
        type: String,
      },
      repair_image: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      details: {
        type: String,
      },

      repair_cost: {
        type: Number,
      },
      guaranty: {
        type: String,
      },
      warranty: {
        type: String,
      },
      product_id: {
        type: Schema.Types.ObjectId,
        ref: "productModel",
      },
      product_variation_id: {
        type: Schema.Types.ObjectId,
        ref: "productVariationModel",
      },
    },
  ],
  description: {
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
const serviceModel = mongoose.model("service", serviceSchema);

module.exports = serviceModel;
