const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },

            quantity: {
                type: Number,
                required: true,
                min: 1
            },

            farmerPrice: {
                type: Number,
                required: true,
                min: 0
            },

            commission: {
                type: Number,
                required: true,
                min: 0
            },

            sellingPrice: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],

    transportFee: {
        type: Number,
        required: true,
        min: 0
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },

    status: {
        type: String,
        enum: [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ],
        default: "Pending"
    },

    delivery: {

        fullname: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        whatsapp: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        }
    },

    farmerConfirmation: {

        farmerName: {
            type: String,
            trim: true
        },

        farmerPhone: {
            type: String,
            trim: true
        },

        accountNumber: {
            type: String,
            trim: true
        },

        bankName: {
            type: String,
            trim: true
        },

        accountName: {
            type: String,
            trim: true
        }
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("Order", orderSchema);