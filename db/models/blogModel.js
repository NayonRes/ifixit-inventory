const mongoose = require("mongoose");

const blogSchema = mongoose.Schema({
    blog_title: {
        type: String,
        required: [true, "Please enter a title"],
    },
    blog_sub_title: {
        type: String,
    },
    writer_name: {
        type: String,
    },
    writer_image: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    thumbnail_image: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    description_1: {
        type: String,
        required: [true, "Please enter a description"],
    },

    image_1: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    description_2: {
        type: String,
    },

    image_2: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    description_3: {
        type: String,
    },
    description_4: {
        type: String,
    },
    order_id: {
        type: Number,
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
const blogModel = mongoose.model("blog", blogSchema);

module.exports = blogModel;
