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
        // Make sure this farmer actually owns a product
        // in this order
        // ----------------------------------------------------

        const farmerOwnsOrderProduct =
            order.products.some(
                item => {

                    return (
                        item.product &&
                        item.product.farmer &&
                        item.product.farmer.toString() ===
                        req.user._id.toString()
                    );
                }
            );


        if (!farmerOwnsOrderProduct) {

            return res.status(403).json({

                message:
                    "You are not authorized to confirm details for this order."
            });
        }


        order.farmerConfirmation = {

            farmerName:
                farmerName.trim(),

            farmerPhone:
                farmerPhone.trim(),

            accountNumber:
                accountNumber.trim(),

            bankName:
                bankName.trim(),

            accountName:
                accountName.trim()
        };


        await order.save();


        res.json({

            message:
                "Farmer details confirmed successfully.",

            confirmation:
                order.farmerConfirmation
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