const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionHistorySchema = mongoose.Schema({
  transaction_source_id: {
    type: Schema.Types.ObjectId,
    refPath: "transaction_source_type", // dynamic reference
    required: [true, "Please select a source ID"],
  },
  transaction_info: [
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
  transaction_source_type: {
    type: String,
    trim: true,
    enum: ["repairModel", "warrantyModel"], // list allowed models
  },
  transaction_type: {
    type: String,
    enum: ["credit", "debit"],
    // default: "credit",
    required: [true, "Please enter transaction type"],
  },

  is_collection_received: {
    type: Boolean,
    default: false,
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

transactionHistorySchema.index({ repair_id: 1 });
const transactionHistoryModel = mongoose.model(
  "transaction_history",
  transactionHistorySchema
);

module.exports = transactionHistoryModel;
