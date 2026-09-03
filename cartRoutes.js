const express = require("express");

const router = express.Router();

const {

    addToCart,

    getCart,

    removeItem
} = require("./cartController");

const protect = require("./authMiddleware");

const buyerOnly = require("./buyerMiddleware");

router.post("/", protect, buyerOnly, addToCart);

router.get("/", protect, buyerOnly, getCart);

router.delete("/:id", protect, buyerOnly, removeItem);

module.exports = router;