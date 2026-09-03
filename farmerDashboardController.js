const Product = require("./product");
const Order = require("./Order");


// ============================================================
// FARMER DASHBOARD
// ============================================================

exports.getDashboard = async (req, res) => {

    try {

        const farmerId =
            req.user._id;


        const products =
            await Product.find({
                farmer: farmerId
            }).sort({
                createdAt: -1
            });


        const orders =
            await Order.find()
                .populate(
                    "buyer",
                    "fullName phone email"
                )
                .populate(
                    "products.product"
                )
                .sort({
                    createdAt: -1
                });


        let totalOrders = 0;
        let revenue = 0;

        const sales = [];

        const countedOrders =
            new Set();


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


                const itemRevenue =
                    Number(item.farmerPrice || 0) *
                    Number(item.quantity || 0);


                revenue += itemRevenue;


                countedOrders.add(
                    order._id.toString()
                );


                sales.push({

                    orderId:
                        order._id,

                    buyer:
                        order.buyer
                            ? {
                                fullName:
                                    order.buyer.fullName,

                                phone:
                                    order.buyer.phone,

                                email:
                                    order.buyer.email
                            }
                            : null,

                    product:
                        item.product.productName,

                    quantity:
                        item.quantity,

                    farmerPrice:
                        item.farmerPrice,

                    commission:
                        item.commission,

                    sellingPrice:
                        item.sellingPrice,

                    productTotal:
                        Number(
                            item.sellingPrice || 0
                        ) *
                        Number(
                            item.quantity || 0
                        ),

                    transportFee:
                        Number(
                            order.transportFee || 0
                        ),

                    delivery:
                        order.delivery,

                    status:
                        order.status,

                    date:
                        order.createdAt
                });
            }
        }


        totalOrders =
            countedOrders.size;


        res.json({

            success: true,

            totalProducts:
                products.length,

            totalOrders,

            revenue,

            products,

            sales
        });


    } catch (error) {

        console.error(
            "FARMER DASHBOARD ERROR:",
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
// UPDATE ORDER STATUS
// ============================================================

exports.updateStatus = async (req, res) => {

    try {

        const allowedStatuses = [

            "Pending",

            "Processing",

            "Shipped",

            "Delivered",

            "Cancelled"
        ];


        const {
            status
        } = req.body;


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                message:
                    "Invalid order status."
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


        const farmerOwnsProduct =
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


        if (!farmerOwnsProduct) {

            return res.status(403).json({

                message:
                    "You are not authorized to update this order."
            });
        }


        order.status =
            status;


        await order.save();


        res.json({

            message:
                "Order status updated successfully.",

            status:
                order.status
        });


    } catch (error) {

        console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};