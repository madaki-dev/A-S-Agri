const Product = require("./product");
const Order = require("./Order");


// ============================================================
// FARMER DASHBOARD
// ============================================================

exports.getDashboard = async (req, res) => {

    try {

        const farmerId = req.user._id;

        // ----------------------------------------------------
        // Get this farmer's products
        // ----------------------------------------------------

        const products = await Product.find({
            farmer: farmerId
        }).sort({
            createdAt: -1
        });


        // ----------------------------------------------------
        // Get all orders
        // ----------------------------------------------------

        const orders = await Order.find()
            .populate(
                "buyer",
                "fullName phone email whatsapp"
            )
            .populate({
                path: "products.product",
                populate: {
                    path: "farmer",
                    select: "fullName phone email"
                }
            })
            .sort({
                createdAt: -1
            });


        let revenue = 0;

        const farmerOrders = [];

        const countedOrders = new Set();


        // ----------------------------------------------------
        // Find orders containing this farmer's products
        // ----------------------------------------------------

        for (const order of orders) {

            for (const item of order.products) {

                if (
                    !item.product ||
                    !item.product.farmer
                ) {
                    continue;
                }


                if (
                    item.product.farmer._id
                        ? item.product.farmer._id.toString() !== farmerId.toString()
                        : item.product.farmer.toString() !== farmerId.toString()
                ) {
                    continue;
                }


                const quantity =
                    Number(item.quantity || 0);

                const farmerPrice =
                    Number(item.farmerPrice || 0);

                const itemRevenue =
                    farmerPrice * quantity;


                revenue += itemRevenue;


                countedOrders.add(
                    order._id.toString()
                );


                farmerOrders.push({

                    orderId:
                        order._id.toString(),

                    buyer: order.buyer
                        ? {
                            _id:
                                order.buyer._id,

                            fullName:
                                order.buyer.fullName,

                            phone:
                                order.buyer.phone,

                            whatsapp:
                                order.buyer.whatsapp,

                            email:
                                order.buyer.email
                        }
                        : null,

                    product:
                        item.product.productName,

                    quantity,

                    farmerPrice,

                    commission:
                        Number(item.commission || 0),

                    sellingPrice:
                        Number(item.sellingPrice || 0),

                    productTotal:
                        Number(item.sellingPrice || 0) *
                        quantity,

                    transportFee:
                        Number(order.transportFee || 0),

                    delivery:
                        order.delivery,

                    status:
                        order.status,

                    date:
                        order.createdAt
                });
            }
        }


        const totalOrders =
            countedOrders.size;


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.json({

            success: true,

            totalProducts:
                products.length,

            totalOrders,

            revenue,

            products,

            orders:
                farmerOrders

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


        const { status } = req.body;


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message: "Invalid order status."
            });
        }


        const order = await Order.findById(
            req.params.id
        ).populate({
            path: "products.product",
            populate: {
                path: "farmer"
            }
        });


        if (!order) {

            return res.status(404).json({
                message: "Order not found."
            });
        }


        const farmerOwnsProduct =
            order.products.some(item => {

                if (
                    !item.product ||
                    !item.product.farmer
                ) {
                    return false;
                }

                const farmerId =
                    item.product.farmer._id ||
                    item.product.farmer;

                return farmerId.toString() ===
                    req.user._id.toString();
            });


        if (!farmerOwnsProduct) {

            return res.status(403).json({
                message:
                    "You are not authorized to update this order."
            });
        }


        order.status = status;

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