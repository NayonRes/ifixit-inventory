const mongoose = require("mongoose");
const { Schema } = mongoose;

const questionSchema = mongoose.Schema({
  source_id: {
    type: Schema.Types.ObjectId,
    refPath: "source_type", // dynamic reference
    required: [true, "Please select a source ID"],
  },
  question: {
    type: String,
    trim: true,
    required: [true, "Please write your question"],
  },
  answer: {
    type: String,
    trim: true,
    default: null,
  },

  source_type: {
    type: String,
    trim: true,
    enum: ["service"], // list allowed models
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

questionSchema.index({ transaction_source_id: 1 });
const questionModel = mongoose.model("question", questionSchema);

module.exports = questionModel;
