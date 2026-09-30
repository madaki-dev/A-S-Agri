const mongoose = require("mongoose");

const paymentProductSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
    },
    {
        _id: false
    }
);


const transportBreakdownSchema = new mongoose.Schema(
    {
        origin: {
            type: String,
            required: true
        },

        destination: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: [
                "intra-state",
                "interstate-small",
                "interstate-weight",
                "interstate-bulk"
            ]
        },

        bags: {
            type: Number,
            required: true,
            min: 0
        },

        weightKg: {
            type: Number,
            required: true,
            min: 0
        },

        baseRoutePrice: {
            type: Number,
            default: null
        },

        currentRoutePrice: {
            type: Number,
            default: null
        },

        truckRatePerTonne: {
            type: Number,
            default: null
        },

        dieselPrice: {
            type: Number,
            required: true,
            min: 0
        },

        fuelMultiplier: {
            type: Number,
            required: true,
            min: 0
        },

        transportFee: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);


const paymentSchema = new mongoose.Schema(
    {
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
            default: null
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

        transportBreakdown: {
            type: [transportBreakdownSchema],
            default: []
        },

        dieselPrice: {
            type: Number,
            required: true,
            min: 0
        },

        fuelMultiplier: {
            type: Number,
            required: true,
            min: 0
        },

        products: {
            type: [paymentProductSchema],
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Successful",
                "Failed"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "Payment",
        paymentSchema
    );