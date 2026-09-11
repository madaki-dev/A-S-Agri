const Product = require("./product");
const Order = require("./Order");


// ============================================================
// FARMER DASHBOARD
// ============================================================

exports.getDashboard = async (req, res) => {
    try {
        const farmerId = req.user._id;

        // ==========================================
        // GET THIS FARMER'S PRODUCTS
        // ==========================================

        const products = await Product.find({
            farmer: farmerId
        }).sort({
            createdAt: -1
        });

        const productIds = products.map(
            product => product._id
        );

        // ==========================================
        // FIND ORDERS CONTAINING FARMER PRODUCTS
        // ==========================================

        const orders = productIds.length
            ? await Order.find({
                "products.product": {
                    $in: productIds
                }
            })
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
                })
            : [];

        // ======================================
        // DEBUG
        // ======================================

        console.log("FARMER ID:", farmerId.toString());

        console.log(
            "FARMER PRODUCT IDS:",
            productIds.map(id => id.toString())
        );

        console.log(
            "ORDERS FOUND:",
            orders.length
        );

        // ==========================================
        // BUILD FARMER ORDERS
        // ==========================================

        const farmerOrders = [];

        let revenue = 0;

        const countedOrders = new Set();

        for (const order of orders) {

            for (const item of order.products) {

                if (!item.product) {
                    continue;
                }

                // Make absolutely sure this product
                // belongs to the logged-in farmer.

                const itemFarmer =
                    item.product.farmer?._id ||
                    item.product.farmer;

                if (!itemFarmer) {
                    continue;
                }

                if (
                    itemFarmer.toString() !==
                    farmerId.toString()
                ) {
                    continue;
                }

                const quantity =
                    Number(item.quantity || 0);

                const farmerPrice =
                    Number(item.farmerPrice || 0);

                const commission =
                    Number(item.commission || 0);

                const sellingPrice =
                    Number(item.sellingPrice || 0);

                const farmerEarnings =
                    farmerPrice * quantity;

                const commissionTotal =
                    commission * quantity;

                const productTotal =
                    sellingPrice * quantity;

                revenue += farmerEarnings;

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

                    productId:
                        item.product._id,

                    quantity,

                    farmerPrice,

                    commission,

                    commissionTotal,

                    sellingPrice,

                    productTotal,

                    farmerEarnings,

                    transportFee:
                        Number(
                            order.transportFee || 0
                        ),

                    delivery:
                        order.delivery,

                    status:
                        order.status,

                    transactionId:
                        order.transactionId,

                    date:
                        order.createdAt
                });
            }
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({

            success: true,

            totalProducts:
                products.length,

            totalOrders:
                countedOrders.size,

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