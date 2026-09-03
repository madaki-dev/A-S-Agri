const express = require("express");

const router = express.Router();

const protect = require("./authMiddleware");

const farmerOnly = require("./farmerMiddleware");

const {

    getDashboard,

    updateStatus

} = require("./farmerDashboardController");

router.get(

    "/",

    protect,

    farmerOnly,

    getDashboard

);

router.patch(

    "/:id/status",

    protect,

    farmerOnly,

    updateStatus

);

module.exports = router;