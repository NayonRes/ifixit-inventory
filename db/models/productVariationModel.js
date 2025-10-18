const mongoose = require("mongoose");
const { Schema } = mongoose;

const productVariationSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter product variation name"],
    trim: true,
    // unique: true,
  },
  quality: {
    type: String,

    // unique: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: "product",
    required: [true, "Please enter product Id"],
  },
  price: {
    type: Number,
    default: 0,
  },
  base_price: {
    type: Number,
    // required: [true, "Please enter the product name"],
    default: 0,
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
productVariationSchema.index({ name: 1 });
productVariationSchema.index({ product_variation_id: 1 });
productVariationModel = mongoose.model(
  "product_variation",
  productVariationSchema
);

const saveData = async () => {
  let totalData = await productVariationModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const sparePartVariationDoc = new productVariationModel({
      name: "Primary",
    });
    await sparePartVariationDoc.save();
  }
};
// saveData();

module.exports = productVariationModel;
