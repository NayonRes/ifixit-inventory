const mongoose = require("mongoose");
const { Schema } = mongoose;
const deviceSchema = mongoose.Schema({
  device_id: {
    type: String,
    required: [true, "Please enter device id"],
  },
  name: {
    type: String,
    required: [true, "Please enter device name"],
    trim: true,
    unique: true,
  },
  // parent_name: {
  //   type: String,
  //   // default: 10000,
  //   // required: [true, "Please enter parent name"],
  // },
  device_brand_id: {
    type: Schema.Types.ObjectId,
    ref: "deviceBrandModel", // Reference to the brandModel
    default: null,
    // required: [true, "Please enter select device model"],
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "device",
    default: null,
    // required: [true, "Please enter product Id"],
  },
  image: {
    public_id: {
      type: String,
      // required: true,
    },
    url: {
      type: String,
      // required: true,
    },
  },
  icon: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
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
deviceSchema.index({ order_no: 1 });
const deviceModel = mongoose.model("device", deviceSchema);

// const saveData = async () => {
//   let totalData = await deviceModel.countDocuments();
//   console.log("totalData 123456", totalData);
//   if (totalData < 1) {
//     const deviceDoc = new deviceModel({
//       device_id: "d100",
//       name: "Primary",
//       parent_name: "Primary",
//       order_no: 0,
//     });
//     await deviceDoc.save();
//   }
// };
// saveData();

module.exports = deviceModel;
