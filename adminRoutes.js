const express = require("express");

const router = express.Router();

const protect = require("./authMiddleware");

const adminOnly = require("./adminMiddleware");

const {

    getDashboard,

    getAllOrders

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

module.exports = router;