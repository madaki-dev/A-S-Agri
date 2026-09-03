const express = require("express");
const router = express.Router();

const protect = require("./authMiddleware");
const farmerOnly = require("./farmerMiddleware");

const {
    updateOrderStatus
} = require("./orderController");
const { createProduct } = require("./productController");

router.post(

    "/create-product",

    protect,

    farmerOnly,

    createProduct

)

router.patch(

    "/:id/status",

    protect,

    farmerOnly,

    updateOrderStatus
);

module.exports = router;