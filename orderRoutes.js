const express = require("express");

const router = express.Router();

const {
    getMyOrders,
    getFarmerSales,
    confirmFarmerDetails
} = require("./orderController");

const protect =
    require("./authMiddleware");

const farmerOnly =
    require("./farmerMiddleware");

const buyerOnly =
    require("./buyerMiddleware");


router.get(
    "/my-orders",
    protect,
    buyerOnly,
    getMyOrders
);


router.get(
    "/farmer-sales",
    protect,
    farmerOnly,
    getFarmerSales
);


router.patch(
    "/:id/confirm",
    protect,
    farmerOnly,
    confirmFarmerDetails
);


module.exports = router;