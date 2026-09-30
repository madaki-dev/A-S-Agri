const mongoose = require("mongoose");

const transportBreakdownSchema = new mongoose.Schema(
    {
        origin: {
            type: String,
            required: true,
            trim: true
        },

        destination: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: [
                "intra-state",
                "interstate-small",
                "interstate-weight",
                "interstate-bulk"
            ],
            required: true
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
            default: null,
            min: 0
        },

        currentRoutePrice: {
            type: Number,
            default: null,
            min: 0
        },

        truckRatePerTonne: {
            type: Number,
            default: null,
            min: 0
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
    { _id: false }
);


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

    /*
     * Total transport paid by the buyer.
     */
    transportFee: {
        type: Number,
        required: true,
        min: 0
    },

    /*
     * Exact transport calculation used when the buyer paid.
     * This prevents future route/fuel changes from altering old orders.
     */
    transportBreakdown: {
        type: [transportBreakdownSchema],
        default: []
    },

    /*
     * Diesel price used when the transport fee was calculated.
     */
    dieselPrice: {
        type: Number,
        required: true,
        min: 0
    },

    /*
     * Fuel adjustment multiplier used for this order.
     */
    fuelMultiplier: {
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
            "Paid",
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

    farmerPayouts: [
        {
            farmer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

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
            },

            amount: {
                type: Number,
                required: true,
                min: 0
            },

            commission: {
                type: Number,
                required: true,
                min: 0
            },

            status: {
                type: String,
                enum: ["Pending", "Paid"],
                default: "Pending"
            },

            paidAt: {
                type: Date,
                default: null
            }
        }
    ]

}, {
    timestamps: true
});


module.exports = mongoose.model("Order", orderSchema);