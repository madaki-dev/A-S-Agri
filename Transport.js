const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema({

    state: {
        type: String,
        required: true,
        unique: true
    },

    transportPrice: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("Transport", transportSchema);