const mongoose = require("mongoose");
const { Schema } = mongoose;

const transferSkuSchema = mongoose.Schema({
  transfer_from: {
    type: Schema.Types.ObjectId,
    ref: "branchModel",
    required: [true, "Please select branch"],
  },
  transfer_to: {
    type: Schema.Types.ObjectId,
    ref: "branchModel",
    required: [true, "Please select branch"],
  },
  transfer_stockss: {
    type: [Number],
    required: [true, "Please enter at list one sku"],
  },
  transfer_status: {
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
transferSkuSchema.index({ name: 1 });
const transferStockModel = mongoose.model("transfer_stocks", transferSkuSchema);

// const saveData = async () => {
//     let totalData = await transferStockModel.countDocuments();
//     console.log("totalData 123456", totalData);
//     if (totalData < 1) {
//         const transferSkuDoc = new transferStockModel({
//             transferSku_id: "b100",
//             name: "IFIXIT",
//             parent_name: "IFIXIT",
//         });
//         await transferSkuDoc.save();
//     }
// };
// saveData();

module.exports = transferStockModel;
