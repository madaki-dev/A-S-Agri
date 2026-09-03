const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    productName: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    stock: {
        type: Number,
        required: true
    },

    farmerPrice: {
        type: Number,
        required: true
    },

    commission: {
        type: Number,
        default: 0
    },

    sellingPrice: {
        type: Number,
        required: true
    },

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);