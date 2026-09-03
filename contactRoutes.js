const express = require("express");

const router =
    express.Router();

const {
    sendContactMessage
} = require("./contactController");


router.post(
    "/",
    sendContactMessage
);


module.exports = router;