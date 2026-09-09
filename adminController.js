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