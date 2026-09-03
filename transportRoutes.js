const express = require("express");

const router = express.Router();

const {
    createTransport,
    getTransport,
    getTransportPrices,
    getTransportPriceByState,
    updateTransportPrice
} = require("./transportController");


router.post(
    "/",
    createTransport
);


router.get(
    "/",
    getTransport
);


router.get(
    "/prices",
    getTransportPrices
);


router.get(
    "/prices/:state",
    getTransportPriceByState
);


router.patch(
    "/:id",
    updateTransportPrice
);


module.exports = router;