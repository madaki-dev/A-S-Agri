const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    quantity: {
        type: Number,
        min: 1,
        default: 1
    }
}, { timestamps: true });

cartSchema.index({ buyer: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);