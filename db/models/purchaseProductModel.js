const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseProductSchema = mongoose.Schema({
  // name: {
  //   type: String,
  //   required: [true, "Please enter purchaseProduct name"],
  //   trim: true,
  // },
  spare_parts_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartVariationModel",
    required: [true, "Please enter Spare part Id"],
  },
  spare_parts_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartVariationModel",
    required: [true, "Please enter Spare part Id"],
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
  "purchaseProduct",
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
