const protect = require("./authMiddleware");

const buyerOnly = require("./buyerMiddleware");

router.post(

    "/checkout",

    protect,

    buyerOnly,

    checkout
);