const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    tx_ref: {
        type: String,
        required: true,
        unique: true
    },

    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

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
    },

    transportFee: {
        type: Number,
        required: true,
        min: 0
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

    status: {
        type: String,
        enum: [
            "Pending",
            "Successful",
            "Failed"
        ],
        default: "Pending"
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("Payment", paymentSchema);