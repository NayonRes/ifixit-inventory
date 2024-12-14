const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseReturnSchema = mongoose.Schema({
  spare_parts_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsModel",
    required: [true, "Please select spare parts"],
  },
  spare_parts_variation_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartsVariationModel",
    required: [true, "Please select spare parts variation"],
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: "branchModel",
    required: [true, "Please select branch"],
  },
  purchase_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseModel",
    required: [true, "Please select purchase"],
  },
  purchase_product_id: {
    type: Schema.Types.ObjectId,
    ref: "purchaseProductModel",
    required: [true, "Please select purchase product"],
  },
  // supplier_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: "supplierModel",
  //   required: [true, "Please select purchase product"],
  // },

  sku_number: {
    type: Number,
    default: null,
    required: [true, "Please enter the SKU number"],
  },
  invoice_number: {
    type: String,
    default: null,
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

const purchaseReturnModel = mongoose.model(
  "purchase_return",
  purchaseReturnSchema
);

module.exports = purchaseReturnModel;
