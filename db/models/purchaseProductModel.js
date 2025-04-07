const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseProductSchema = mongoose.Schema({
  // name: {
  //   type: String,
  //   required: [true, "Please enter purchase_product name"],
  //   trim: true,
  // },
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

  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseModel",
    required: [true, "Please enter purchase Id"],
  },
  quantity: {
    type: Number,
    default: 0,
  },
  unit_price: {
    type: Number,
    default: 0,
  },
  is_sku_generated: {
    type: Boolean,
    default: false,
  },
  remarks: {
    type: String,
  },
  purchase_product_status: {
    type: String,
    required: [true, "Please enter purchase status"],
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
purchaseProductSchema.index({ name: 1 });
const purchaseProductModel = mongoose.model(
  "purchase_product",
  purchaseProductSchema
);

const saveData = async () => {
  let totalData = await purchaseProductModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const purchaseProductDoc = new purchaseProductModel({
      name: "Primary",
    });
    await purchaseProductDoc.save();
  }
};
// saveData();

module.exports = purchaseProductModel;
