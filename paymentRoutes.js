const express = require("express");

const router = express.Router();

const {

    initializePayment,

    verifyPayment

} = require("./paymentController");

const protect = require("./authMiddleware");

const buyerOnly = require("./buyerMiddleware");

router.post(

    "/initialize",

    protect,

    buyerOnly,

    initializePayment

);

router.post(

    "/verify/:id",

    protect,

    buyerOnly,

    verifyPayment

);

module.exports = router;