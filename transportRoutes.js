const express = require("express");
const router = express.Router();

const {
    getTransport,
    getTransportPrices,
    getTransportLocations,
    getTransportRoute,
    updateTransportPrice,
    getTransportSettings,
    updateTransportSettings,
    calculateTransport
} = require("./transportController");

const protect = require("./authMiddleware");
const buyerOnly = require("./buyerMiddleware");
const adminOnly = require("./adminMiddleware");


// Public/read routes

router.get(
    "/",
    getTransport
);

router.get(
    "/prices",
    getTransportPrices
);

router.get(
    "/locations",
    getTransportLocations
);

router.get(
    "/route/:origin/:destination",
    getTransportRoute
);

router.get(
    "/settings",
    getTransportSettings
);


// Buyer calculation

router.post(
    "/calculate",
    protect,
    buyerOnly,
    calculateTransport
);


// Admin updates

router.patch(
    "/settings",
    protect,
    adminOnly,
    updateTransportSettings
);

router.patch(
    "/:id",
    protect,
    adminOnly,
    updateTransportPrice
);

module.exports = router;