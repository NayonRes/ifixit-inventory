const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema({
  // name: {
  //   type: String,
  //   required: [true, "Please enter category name"],
  //   trim: true,
  //   unique: true,
  // },
  expense_date: {
    type: Date,
    required: [true, "Please select purchase date"],
  },
  expense_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "expense_category",
    required: [true, "Please select expense category"],
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "branch", // Reference to the brandModel
    required: [true, "Please enter business location"],
  },
  amount: {
    type: Number,
    default: 0,
    required: [true, "Please enter amount"],
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

expenseSchema.index({ name: 1 });

const expenseModel = mongoose.model("expense", expenseSchema);

const saveData = async () => {
  let totalData = await expenseModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const catDoc = new expenseModel({
      category_id: "c100",
      name: "Primary",
      parent_name: "Primary",
    });
    await catDoc.save();
  }
};
// saveData();

module.exports = expenseModel;
