const express = require("express");

const router = express.Router();

const protect = require("./authMiddleware");

const adminOnly = require("./adminMiddleware");

const {

    getDashboard,

    getAllOrders

} = require("./adminController");

const {

    getDashboard,

    getAllOrders,

    getPayouts

} = require("./adminController");

const {

    getDashboard,

    getAllOrders,

    getPayouts,

    markPayoutPaid

} = require("./adminController");

router.get(

    "/dashboard",

    protect,

    adminOnly,

    getDashboard

);

router.get(

    "/orders",

    protect,

    adminOnly,

    getAllOrders

);

router.get(

    "/payouts",

    protect,

    adminOnly,

    getPayouts

);

router.patch(

    "/payouts/:orderId/:payoutId/paid",

    protect,

    adminOnly,

    markPayoutPaid

);

module.exports = router;