const Order = require("./Order");


exports.getDashboard = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate("buyer", "fullName phone whatsapp email")
            .populate({
                path: "products.product",
                populate: {
                    path: "farmer",
                    select: "fullName phone email"
                }
            })
            .sort({ createdAt: -1 });

        let totalSales = 0;
        let commissionEarned = 0;

        for (const order of orders) {

            totalSales += Number(order.totalAmount || 0);

            for (const item of order.products) {
                commissionEarned +=
                    Number(item.commission || 0) *
                    Number(item.quantity || 0);
            }
        }

        res.json({
            success: true,

            totalSales,

            totalOrders: orders.length,

            commissionEarned,

            orders
        });

    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};


exports.getAllOrders = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate(
                "buyer",
                "fullName email phone whatsapp"
            )
            .populate({
                path: "products.product",
                populate: {
                    path: "farmer",
                    select: "fullName phone email"
                }
            })
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({

            _id: order._id,

            buyer: order.buyer
                ? {
                    _id:
                        order.buyer._id,

                    fullName:
                        order.buyer.fullName,

                    email:
                        order.buyer.email,

                    phone:
                        order.buyer.phone,

                    whatsapp:
                        order.buyer.whatsapp
                }
                : null,

            products:
                order.products.map(item => ({

                    product:
                        item.product
                            ? {
                                _id:
                                    item.product._id,

                                productName:
                                    item.product.productName,

                                category:
                                    item.product.category,

                                farmer:
                                    item.product.farmer
                                        ? {
                                            _id:
                                                item.product.farmer._id,

                                            fullName:
                                                item.product.farmer.fullName,

                                            phone:
                                                item.product.farmer.phone
                                        }
                                        : null
                            }
                            : null,

                    quantity:
                        item.quantity,

                    farmerPrice:
                        item.farmerPrice,

                    commission:
                        item.commission,

                    sellingPrice:
                        item.sellingPrice,

                    subtotal:
                        Number(item.sellingPrice || 0) *
                        Number(item.quantity || 0)

                })),

            totalAmount:
                order.totalAmount,

            transportFee:
                order.transportFee || 0,

            // Buyer delivery information
            delivery: order.delivery
                ? {
                    fullname:
                        order.delivery.fullname,

                    phone:
                        order.delivery.phone,

                    whatsapp:
                        order.delivery.whatsapp,

                    state:
                        order.delivery.state,

                    address:
                        order.delivery.address
                }
                : null,

            status:
                order.status,

            transactionId:
                order.transactionId,

            createdAt:
                order.createdAt

        }));

        res.json(formattedOrders);

    } catch (error) {
        console.error("ADMIN ORDERS ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};

exports.getPayouts = async (req, res) => {
    try {
        const orders = await Order.find({
            "farmerPayouts.0": { $exists: true }
        })
            .populate(
                "farmerPayouts.farmer",
                "fullName phone email"
            )
            .sort({ createdAt: -1 });

        const payouts = [];

        for (const order of orders) {

            for (const payout of order.farmerPayouts) {

                payouts.push({
                    _id: payout._id,

                    orderId: order._id,

                    farmer: payout.farmer
                        ? {
                            _id: payout.farmer._id,
                            fullName: payout.farmer.fullName,
                            phone: payout.farmer.phone,
                            email: payout.farmer.email
                        }
                        : {
                            _id: payout.farmer,
                            fullName: payout.farmerName,
                            phone: payout.farmerPhone
                        },

                    farmerEarnings:
                        Number(payout.amount || 0),

                    commission:
                        Number(payout.commission || 0),

                    farmerConfirmation: {
                        farmerName: payout.farmerName,
                        farmerPhone: payout.farmerPhone,
                        accountNumber: payout.accountNumber,
                        bankName: payout.bankName,
                        accountName: payout.accountName
                    },

                    status: payout.status,

                    paidAt: payout.paidAt,

                    createdAt: order.createdAt
                });
            }
        }

        res.json({
            success: true,
            payouts
        });

    } catch (error) {

        console.error(
            "ADMIN PAYOUTS ERROR:",
            error
        );

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};

exports.markPayoutPaid = async (req, res) => {
    try {
        const { orderId, payoutId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        const payout = order.farmerPayouts.id(payoutId);

        if (!payout) {
            return res.status(404).json({
                message: "Payout not found."
            });
        }

        if (payout.status === "Paid") {
            return res.status(400).json({
                message: "This payout has already been marked as paid."
            });
        }

        payout.status = "Paid";
        payout.paidAt = new Date();

        await order.save();

        res.json({
            success: true,
            message: "Payout marked as paid.",
            payout
        });

    } catch (error) {

        console.error(
            "MARK PAYOUT PAID ERROR:",
            error
        );

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};