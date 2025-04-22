const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter title"],
  },
  subtitle: {
    type: String,
    required: [true, "Please enter subtitle"],
  },

  image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  description: {
    type: String,
    required: [true, "Please enter description"],
  },
  conclusion: {
    type: String,
    required: [true, "Please enter conclusion"],
  },
  order_no: {
    type: Number,
    required: [true, "Please enter device order no"],
    unique: true,
  },

  body_info: [
    {
      title: {
        type: String,
      },
      image: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      details: {
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
const blogModel = mongoose.model("blog", blogSchema);

module.exports = blogModel;
