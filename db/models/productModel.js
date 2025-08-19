const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = mongoose.Schema({
  product_id: {
    type: String,
    required: [true, "Please enter the product id"],
    trim: true,
  },
  name: {
    type: String,
    required: [true, "Please enter the name"],
    trim: true,
    unique: true,
  },
  brand_id: {
    type: Schema.Types.ObjectId,
    ref: "brandModel", // Reference to the brandModel
    required: [true, "Please enter select brand"],
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: "categoryModel",
    required: [true, "Please enter select category"],
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: "deviceModel",
    required: [true, "Please enter select device"],
  },
  model_id: {
    type: Schema.Types.ObjectId,
    ref: "modelModel",
    required: [true, "Please enter select model"],
  },
  attachable_models: [
    {
      type: Schema.Types.ObjectId,
      ref: "modelModel",
      required: [true, "Please select at least one model"],
    },
  ],
  price: {
    type: Number,
    // required: [true, "Please enter the product name"],

    default: 0,
  },

  warranty: {
    type: Number,
    // required: [true, "Please enter the product price"],
    min: [0, "warranty can not less than 0"],
    default: null,
  },
  description: {
    type: String,
    default: null,
    // trim: true,
    // maxLength: [3000, "Name can not exceed 3000 character"],
  },
  images: [
    {
      public_id: {
        type: String,
      },
      url: {
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

productSchema.index({
  category_id: 1,
  brand_id: 1,
  device_id: 1,
  model_id: 1,
});
productSchema.index({ name: 1 });
productSchema.index({ price: 1 });
productSchema.index({ created_at: -1 });
const productModel = mongoose.model("product", productSchema);

module.exports = productModel;
