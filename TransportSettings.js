const mongoose = require("mongoose");

const transportSettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "default",
            immutable: true
        },

        /*
         * Fixed reference diesel price.
         *
         * This should normally remain unchanged.
         * It is the reference point for fuel adjustment.
         */
        baseDieselPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 1662
        },

        /*
         * Current diesel price.
         *
         * Admin can update this when market diesel
         * prices change.
         */
        currentDieselPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 1662
        },

        /*
         * Base truck rate per tonne.
         */
        truckRatePerTonne: {
            type: Number,
            required: true,
            min: 0,
            default: 46228
        },

        /*
         * How strongly diesel changes affect transport.
         *
         * 0.6 = 60% of the proportional diesel change.
         */
        fuelSensitivity: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.6
        },

        /*
         * Same-state transportation:
         * ₦8,000 per 10 bags.
         */
        intraStatePerTenBags: {
            type: Number,
            required: true,
            min: 0,
            default: 8000
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "TransportSettings",
        transportSettingsSchema
    );