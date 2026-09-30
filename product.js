const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        image: {
            type: String,
            required: true
        },

        stock: {
            type: Number,
            required: true,
            min: 0
        },

        farmerPrice: {
            type: Number,
            required: true,
            min: 0
        },

        commission: {
            type: Number,
            default: 0,
            min: 0
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },

        priceUnit: {
            type: String,
            enum: [
                "bag",
                "100kg bag",
                "50kg bag",
                "kg",
                "ton",
                "crate",
                "bunch",
                "unit"
            ],
            default: "bag"
        },

        weightPerUnitKg: {
            type: Number,
            required: true,
            min: 0.01
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);