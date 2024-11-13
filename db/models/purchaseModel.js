const mongoose = require("mongoose");
const validator = require("validator");

const purchaseSchema = mongoose.Schema({
    purchase_id: {
        type: String,
        required: [true, "Please enter purchase id"],
    },
    supplier_id: {
        type: String,
        required: [true, "Please enter purchase id"],
    },
    purchase_date: {
        type: String,
        required: [true, "Please enter purchase date"],
        trim: true,
        default: Date.now(),
    },
    purchase_status: {
        type: String,
        trim: true,
        default: null
    },
    business_location: {
        type: String,
        required: [true, "Please enter business location"],
    },
    invoice_number: {
        type: String,
        trim: true,
        default: null
    },
    shipping_charge: {
        type: Number,
        default: null
    },
    product_Ids: {
        type: [String],
        default: []
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

const purchaseModel = mongoose.model("purchase", purchaseSchema);

const saveData = async () => {
    let totalData = await purchaseModel.countDocuments();
    console.log("totalData 123456", totalData);
    if (totalData < 1) {
        const supDoc = new purchaseModel({
            purchase_id: "pur100",
            supplier_id: "s100",
            business_location: "primary",
            purchase_date: Date.now(),
        });
        await supDoc.save();
    }
};
saveData();

module.exports = purchaseModel;
