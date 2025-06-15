const mongoose = require("mongoose");

const expenseCategorySchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter category name"],
    trim: true,
    unique: true,
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

expenseCategorySchema.index({ name: 1 });

const expenseCategoryModel = mongoose.model(
  "expense_category",
  expenseCategorySchema
);

const saveData = async () => {
  let totalData = await expenseCategoryModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const catDoc = new expenseCategoryModel({
      category_id: "c100",
      name: "Primary",
      parent_name: "Primary",
    });
    await catDoc.save();
  }
};
// saveData();

module.exports = expenseCategoryModel;
