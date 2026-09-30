const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema(
    {
        /*
         * State where the goods are coming from.
         */
        origin: {
            type: String,
            required: true,
            trim: true
        },

        /*
         * State/FCT where the goods are going.
         */
        destination: {
            type: String,
            required: true,
            trim: true
        },

        /*
         * Original route price.
         *
         * This is the base/midpoint price used when
         * the route was created.
         */
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },

        /*
         * Current route price.
         *
         * Admin can change this later if necessary.
         */
        currentPrice: {
            type: Number,
            required: true,
            min: 0
        },

        /*
         * Optional estimated travel time.
         */
        travelTime: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);


/*
 * There must only be one route for each
 * origin → destination combination.
 *
 * Example:
 *
 * Lagos → Enugu
 * Enugu → Lagos
 *
 * are two different routes.
 */
transportSchema.index(
    {
        origin: 1,
        destination: 1
    },
    {
        unique: true
    }
);


module.exports =
    mongoose.model(
        "Transport",
        transportSchema
    );