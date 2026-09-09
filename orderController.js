const Order = require("./Order");


// ============================================================
// BUYER ORDERS
// ============================================================

exports.getMyOrders = async (req, res) => {

    try {

        const orders =
            await Order.find({
                buyer: req.user._id
            })
                .populate({
                    path: "products.product",
                    populate: {
                        path: "farmer",
                        select:
                            "fullName phone"
                    }
                })
                .sort({
                    createdAt: -1
                });


        res.json(
            orders
        );


    } catch (error) {

        console.error(
            "GET MY ORDERS ERROR:",
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};



// ============================================================
// FARMER SALES
// ============================================================

exports.getFarmerSales = async (req, res) => {

    try {

        const farmerId =
            req.user._id;


        const orders =
            await Order.find()
                .populate(
                    "products.product"
                )
                .populate(
                    "buyer",
                    "fullName email phone"
                )
                .sort({
                    createdAt: -1
                });


        const sales = [];


        for (const order of orders) {

            for (const item of order.products) {

                if (
                    !item.product ||
                    !item.product.farmer
                ) {
                    continue;
                }


                if (
                    item.product.farmer.toString() !==
                    farmerId.toString()
                ) {
                    continue;
                }


                sales.push({

                    orderId:
                        order._id,

                    buyer: {

                        fullName:
                            order.buyer?.fullName ||
                            "",

                        email:
                            order.buyer?.email ||
                            "",

                        phone:
                            order.buyer?.phone ||
                            ""
                    },

                    product:
                        item.product.productName,

                    quantity:
                        item.quantity,

                    farmerPrice:
                        item.farmerPrice,

                    commission:
                        item.commission,

                    amount:
                        Number(
                            item.farmerPrice
                        ) *
                        Number(
                            item.quantity
                        ),

                    transportFee:
                        order.transportFee || 0,

                    delivery:
                        order.delivery,

                    status:
                        order.status,

                    date:
                        order.createdAt
                });
            }
        }


        res.json(
            sales
        );


    } catch (error) {

        console.error(
            "GET FARMER SALES ERROR:",
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};

// ============================================================
// FARMER CONFIRMS PAYMENT DETAILS
// ============================================================

exports.confirmFarmerDetails = async (req, res) => {

    try {

        const {
            farmerName,
            farmerPhone,
            accountNumber,
            bankName,
            accountName
        } = req.body;


        // ----------------------------------------------------
        // Validate payout details
        // ----------------------------------------------------

        if (
            !farmerName ||
            !farmerPhone ||
            !accountNumber ||
            !bankName ||
            !accountName
        ) {

            return res.status(400).json({

                message:
                    "All farmer payment details are required."

            });
        }


        // ----------------------------------------------------
        // Find order and populate products
        // ----------------------------------------------------

        const order =
            await Order.findById(
                req.params.id
            ).populate(
                "products.product"
            );


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found."

            });
        }


        // ----------------------------------------------------
        // Current farmer
        // ----------------------------------------------------

        const farmerId =
            req.user._id.toString();


        // ----------------------------------------------------
        // Find all products in this order belonging
        // to the logged-in farmer
        // ----------------------------------------------------

        const farmerItems =
            order.products.filter(item => {

                if (
                    !item.product ||
                    !item.product.farmer
                ) {
                    return false;
                }


                return (
                    item.product.farmer.toString() ===
                    farmerId
                );

            });


        // ----------------------------------------------------
        // Make sure farmer actually has a product
        // in this order
        // ----------------------------------------------------

        if (!farmerItems.length) {

            return res.status(403).json({

                message:
                    "You are not authorized to confirm details for this order."

            });
        }


        // ----------------------------------------------------
        // Calculate this farmer's earnings
        // and A&S commission
        // ----------------------------------------------------

        let farmerAmount = 0;
        let commissionAmount = 0;


        for (const item of farmerItems) {

            const quantity =
                Number(item.quantity || 0);


            farmerAmount +=
                Number(item.farmerPrice || 0) *
                quantity;


            commissionAmount +=
                Number(item.commission || 0) *
                quantity;

        }


        // ----------------------------------------------------
        // Make sure farmerPayouts exists
        // ----------------------------------------------------

        if (!Array.isArray(order.farmerPayouts)) {

            order.farmerPayouts = [];

        }


        // ----------------------------------------------------
        // Check whether this farmer already has
        // a payout record for this order
        // ----------------------------------------------------

        let payout =
            order.farmerPayouts.find(p => {

                return (
                    p.farmer &&
                    p.farmer.toString() ===
                    farmerId
                );

            });


        // ----------------------------------------------------
        // Update existing payout
        // ----------------------------------------------------

        if (payout) {

            payout.farmerName =
                farmerName.trim();

            payout.farmerPhone =
                farmerPhone.trim();

            payout.accountNumber =
                accountNumber.trim();

            payout.bankName =
                bankName.trim();

            payout.accountName =
                accountName.trim();

            payout.amount =
                farmerAmount;

            payout.commission =
                commissionAmount;


            // Don't reset an already-paid payout
            if (payout.status !== "Paid") {

                payout.status =
                    "Pending";

                payout.paidAt =
                    null;

            }

        }


        // ----------------------------------------------------
        // Create new payout
        // ----------------------------------------------------

        else {

            order.farmerPayouts.push({

                farmer:
                    req.user._id,

                farmerName:
                    farmerName.trim(),

                farmerPhone:
                    farmerPhone.trim(),

                accountNumber:
                    accountNumber.trim(),

                bankName:
                    bankName.trim(),

                accountName:
                    accountName.trim(),

                amount:
                    farmerAmount,

                commission:
                    commissionAmount,

                status:
                    "Pending",

                paidAt:
                    null

            });

        }


        // ----------------------------------------------------
        // Save order
        // ----------------------------------------------------

        await order.save();


        // ----------------------------------------------------
        // Get the saved payout
        // ----------------------------------------------------

        const savedPayout =
            order.farmerPayouts.find(p => {

                return (
                    p.farmer &&
                    p.farmer.toString() ===
                    farmerId
                );

            });


        res.json({

            success:
                true,

            message:
                "Farmer payout details saved successfully.",

            payout: {

                _id:
                    savedPayout._id,

                farmer:
                    savedPayout.farmer,

                farmerName:
                    savedPayout.farmerName,

                farmerPhone:
                    savedPayout.farmerPhone,

                accountNumber:
                    savedPayout.accountNumber,

                bankName:
                    savedPayout.bankName,

                accountName:
                    savedPayout.accountName,

                amount:
                    savedPayout.amount,

                commission:
                    savedPayout.commission,

                status:
                    savedPayout.status,

                paidAt:
                    savedPayout.paidAt

            }

        });


    } catch (error) {

        console.error(
            "CONFIRM FARMER DETAILS ERROR:",
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."

        });

    }

};