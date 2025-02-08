const mongoose = require("mongoose");
const counterSchema = mongoose.Schema({
  key: {
    type: String,
    required: [true, "Please specify the key for the counter"],
    unique: true,
  },
  counter: {
    type: Number,
    required: [true, "Please specify the initial counter value"],
    default: 0,
  },
});

const counterModel = mongoose.model("counter", counterSchema);

const saveData = async () => {
  let totalData = await counterModel.countDocuments();
  console.log("totalData 123456", totalData);
  if (totalData < 1) {
    const counterDoc = new counterModel({
      key: "sparePartsSku",
      counter: 100000,
    });
    await counterDoc.save();
  }
};
saveData();
module.exports = counterModel;
