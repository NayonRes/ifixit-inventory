const mongoose = require("mongoose");
const { Schema } = mongoose;

const sparePartVariationSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter sparePartVariation name"],
    trim: true,
    // unique: true,
  },
  spare_part_id: {
    type: Schema.Types.ObjectId,
    ref: "sparePartModel",
    required: [true, "Please enter Spare part Id"],
  },
  price: {
    type: Number,
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
sparePartVariationSchema.index({ name: 1 });

sparePartVariationModel = mongoose.model(
  "sparePartVariation",
  sparePartVariationSchema
);

const saveData = async () => {
  let totalData = await sparePartVariationModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const sparePartVariationDoc = new sparePartVariationModel({
      name: "Primary",
    });
    await sparePartVariationDoc.save();
  }
};
// saveData();

module.exports = sparePartVariationModel;
