const mongoose = require("mongoose");
const { Schema } = mongoose;

const sparePartSchema = mongoose.Schema({
  sparePart_id: {
    type: String,
    required: [true, "Please enter the spare parts id"],
    trim: true,
  },
  name: {
    type: String,
    required: [true, "Please enter the product name"],
    trim: true,
    maxLength: [60, "Name can not exceed 60 character"],
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

  price: {
    type: Number,
    // required: [true, "Please enter the product name"],

    default: null,
  },

  warranty: {
    type: Number,
    // required: [true, "Please enter the product price"],
    // min: [0, "warranty can not less than 0"],
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


sparePartSchema.index({ category_id: 1, brand_id: 1, device_id: 1, model_id: 1 });
sparePartSchema.index({ name: 1 });
sparePartSchema.index({ price: 1 });
sparePartSchema.index({ created_at: -1 });
const sparePartModel = mongoose.model("sparePart", sparePartSchema);

const saveData = async () => {
  let totalData = await sparePartModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const spDoc = new sparePartModel({
      sparePart_id: "sp100",
      name: "Primary",
    });
    await spDoc.save();
  }
};
// saveData();
module.exports = sparePartModel;
