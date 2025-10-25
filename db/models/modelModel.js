const mongoose = require("mongoose");
const { Schema } = mongoose;

const modelSchema = mongoose.Schema({
  model_id: {
    type: String,
    required: [true, "Please enter model id"],
  },
  
  name: {
    type: String,
    required: [true, "Please enter model name"],
    trim: true,
    unique: true,
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
    unique: true,
  },
  image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: "device",
    required: [true, "Please enter device name"],
  },
  parent_name: {
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
modelSchema.index({ name: 1 });
modelSchema.index({ order_no: 1 });
const modelModel = mongoose.model("model", modelSchema);

const saveData = async () => {
  let totalData = await modelModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const modelDoc = new modelModel({
      model_id: "m100",
      name: "Primary",
      parent_name: "Primary",
    });
    await modelDoc.save();
  }
};
// saveData();

module.exports = modelModel;
