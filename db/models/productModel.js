const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  product_id: {
    type: String,
    required: [true, "Please enter product id"],
  },
  name: {
    type: String,
    // required: [true, "Please enter the product name"],
    trim: true,
    maxLength: [60, "Name can not exceed 60 character"],
  },
  description: {
    type: String,
    // required: [true, "Please enter the product description"],
    // trim: true,
    // maxLength: [3000, "Name can not exceed 3000 character"],
  },
  price: {
    type: Number,
    // required: [true, "Please enter the product price"],
    min: [0, "Price can not less than 0"],
    maxLength: [16, "Price can not exceed 10 character"],
  },
  discount_price: {
    type: Number,
    // required: [true, "Please enter the product price"],
    maxLength: [16, "Price can not exceed 10 character"],
  },

  rating: [
    {
      total_user: {
        type: String,
        default: 5,
        // required: true,
      },
      total_rating_no: {
        type: Number,
        default: 23,
        // required: true,
      },
    },
  ],
  viewed: {
    type: Number,
    default: 0,
  },
  stock_unit: {
    type: Number,
    default: 100,
    min: [0, "Sorry! required stock is not available"],
  },
  total_sales: {
    type: Number,
    default: 0,
    min: [0, "Sorry! sales can't be less than 0"],
  },
  sku: {
    type: String,
    // required: [true, "Please enter the product name"],
    trim: true,
    maxLength: [20, "Name can not exceed 20 character"],
  },
  images: [
    {
      public_id: {
        type: String,
        // default: "N/A",
        // required: true,
      },
      url: {
        type: String,
        // required: true,
        // default: "N/A",
      },
    },
  ],
  filter_id: {
    type: Array,
  },
  store_id: {
    type: String,
    default: "N/A",
    // required: [true, "Please enter the product category"],
  },
  vaucher_id: {
    type: String,
    default: "N/A",
    // required: [true, "Please enter the product category"],
  },
  category_id: {
    type: String,
    // required: [true, "Please enter the product category"],
  },
  location_id: {
    type: String,
    // required: [true, "Please enter the product location"],
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

module.exports = mongoose.model("product", productSchema);
