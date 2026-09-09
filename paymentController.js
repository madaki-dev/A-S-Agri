const mongoose = require("mongoose");
const axios = require("axios");

const Cart = require("./Cart");
const Payment = require("./payment");
const Order = require("./Order");
const Product = require("./product");
const Transport = require("./Transport");
const User = require("./User");

const sendOrderEmail = require("./Utils/sendOrderEmail");


exports.initializePayment = async (req, res) => {
    try {
        const {
            fullname,
            phone,
            whatsapp,
            state,
            address
        } = req.body;

        if (
            !fullname ||
            !phone ||
            !whatsapp ||
            !state ||
            !address
        ) {
            return res.status(400).json({
                message: "All delivery details are required."
            });
        }

        const cart = await Cart.find({
            buyer: req.user._id
        }).populate("product");

        if (!cart.length) {
            return res.status(400).json({
                message: "Your cart is empty."
            });
        }

        let productsTotal = 0;

        const paymentProducts = [];

        for (const item of cart) {

            if (!item.product) {
                return res.status(400).json({
                    message:
                        "A product in your cart no longer exists."
                });
            }

            const quantity = Number(item.quantity);

            const stock = Number(
                item.product.stock
            );

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    message:
                        `Invalid quantity for ${item.product.productName}.`
                });
            }

            if (stock <= 0) {
                return res.status(400).json({
                    message:
                        `${item.product.productName} is out of stock.`
                });
            }

            if (quantity > stock) {
                return res.status(400).json({
                    message:
                        `${item.product.productName} only has ${stock} item(s) available.`
                });
            }

            const farmerPrice =
                Number(item.product.farmerPrice);

            const commission =
                Number(item.product.commission);

            const sellingPrice =
                Number(item.product.sellingPrice);

            if (
                !Number.isFinite(farmerPrice) ||
                !Number.isFinite(commission) ||
                !Number.isFinite(sellingPrice)
            ) {
                return res.status(400).json({
                    message:
                        `Invalid price information for ${item.product.productName}.`
                });
            }

            productsTotal +=
                sellingPrice * quantity;

            paymentProducts.push({
                product: item.product._id,
                quantity,
                farmerPrice,
                commission,
                sellingPrice
            });
        }

        const normalizedState =
            state.trim();

        const transport =
            await Transport.findOne({
                state: {
                    $regex:
                        `^${normalizedState}$`,
                    $options: "i"
                }
            });

        if (!transport) {
            return res.status(400).json({
                message:
                    "Transport price is not available for this state."
            });
        }

        const transportFee =
            Number(transport.transportPrice);

        if (
            !Number.isFinite(transportFee) ||
            transportFee < 0
        ) {
            return res.status(400).json({
                message:
                    "Invalid transport price."
            });
        }

        const totalAmount =
            productsTotal + transportFee;

        const tx_ref =
            `AS-${Date.now()}-${req.user._id}`;

        const savedPayment =
            await Payment.create({
                buyer: req.user._id,

                tx_ref,

                amount: totalAmount,

                fullname:
                    fullname.trim(),

                phone:
                    phone.trim(),

                whatsapp:
                    whatsapp.trim(),

                state:
                    normalizedState,

                address:
                    address.trim(),

                transportFee,

                products:
                    paymentProducts,

                status: "Pending"
            });

        const flutterwaveResponse =
            await axios.post(
                "https://api.flutterwave.com/v3/payments",

                {
                    tx_ref,

                    amount:
                        totalAmount,

                    currency:
                        "NGN",

                    redirect_url:
                        `${process.env.FRONTEND_URL}/payment-success.html`,

                    customer: {
                        email:
                            req.user.email,

                        name:
                            fullname.trim(),

                        phonenumber:
                            phone.trim()
                    },

                    customizations: {
                        title:
                            "A&S Agri",

                        description:
                            "Agricultural marketplace purchase"
                    }
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.FLW_SECRET_KEY}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

        const paymentLink =
            flutterwaveResponse
                .data
                ?.data
                ?.link;

        if (!paymentLink) {

            await Payment.findByIdAndUpdate(
                savedPayment._id,
                {
                    status: "Failed"
                }
            );

            return res.status(500).json({
                message:
                    "Flutterwave did not return a payment link."
            });
        }

        res.json({
            success: true,

            paymentLink,

            tx_ref,

            amount:
                totalAmount,

            paymentId:
                savedPayment._id
        });

    } catch (error) {

        console.error(
            "INITIALIZE PAYMENT ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message ||
                "Payment initialization failed."
        });
    }
};


exports.verifyPayment = async (req, res) => {

    let session;

    try {

        const transactionId =
            String(req.params.id);

        if (!transactionId) {
            return res.status(400).json({
                message:
                    "Transaction ID is required."
            });
        }


        // ==========================================
        // VERIFY PAYMENT WITH FLUTTERWAVE
        // ==========================================

        const flutterwaveResponse =
            await axios.get(
                `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.FLW_SECRET_KEY}`
                    }
                }
            );


        const paymentData =
            flutterwaveResponse
                .data
                ?.data;

        if (!paymentData) {
            return res.status(400).json({
                message:
                    "Flutterwave returned no payment data."
            });
        }


        if (
            paymentData.status !==
            "successful"
        ) {
            return res.status(400).json({
                message:
                    "Payment was not successful."
            });
        }


        if (
            paymentData.currency !==
            "NGN"
        ) {
            return res.status(400).json({
                message:
                    "Invalid payment currency."
            });
        }


        const tx_ref =
            paymentData.tx_ref;

        if (!tx_ref) {
            return res.status(400).json({
                message:
                    "Transaction reference was not returned."
            });
        }


        // ==========================================
        // FIND OUR PAYMENT RECORD
        // ==========================================

        const savedPayment =
            await Payment.findOne({
                tx_ref
            });

        if (!savedPayment) {
            return res.status(404).json({
                message:
                    "Payment record not found."
            });
        }


        if (
            savedPayment.buyer.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to verify this payment."
            });
        }


        // ==========================================
        // PREVENT DUPLICATE PROCESSING
        // ==========================================

        if (
            savedPayment.status ===
            "Successful"
        ) {

            const existingOrder =
                await Order.findOne({
                    transactionId
                });

            return res.json({
                success: true,

                message:
                    "Payment has already been verified.",

                order:
                    existingOrder
            });
        }


        const flutterwaveAmount =
            Number(paymentData.amount);

        const expectedAmount =
            Number(savedPayment.amount);


        if (
            Math.abs(
                flutterwaveAmount -
                expectedAmount
            ) > 0.01
        ) {
            return res.status(400).json({
                message:
                    "Payment amount does not match the expected amount."
            });
        }


        const existingOrder =
            await Order.findOne({
                transactionId
            });

        if (existingOrder) {
            return res.json({
                success: true,

                message:
                    "Order already exists for this transaction.",

                order:
                    existingOrder
            });
        }


        // ==========================================
        // START DATABASE TRANSACTION
        // ==========================================

        session =
            await mongoose.startSession();

        session.startTransaction();


        const orderProducts = [];


        // ==========================================
        // CHECK STOCK
        // ==========================================

        for (
            const item
            of savedPayment.products
        ) {

            const product =
                await Product.findById(
                    item.product
                ).session(session);


            if (!product) {
                throw new Error(
                    "One of the purchased products no longer exists."
                );
            }


            if (
                Number(item.quantity) >
                Number(product.stock)
            ) {
                throw new Error(
                    `${product.productName} no longer has enough stock.`
                );
            }


            orderProducts.push({

                product:
                    product._id,

                quantity:
                    item.quantity,

                farmerPrice:
                    item.farmerPrice,

                commission:
                    item.commission,

                sellingPrice:
                    item.sellingPrice
            });
        }


        // ==========================================
        // DECREASE STOCK
        // ==========================================

        for (
            const item
            of savedPayment.products
        ) {

            const updatedProduct =
                await Product.findOneAndUpdate(

                    {
                        _id:
                            item.product,

                        stock: {
                            $gte:
                                Number(
                                    item.quantity
                                )
                        }
                    },

                    {
                        $inc: {
                            stock:
                                -Number(
                                    item.quantity
                                )
                        }
                    },

                    {
                        new: true,

                        session
                    }
                );


            if (!updatedProduct) {
                throw new Error(
                    "Product stock changed while processing the order."
                );
            }
        }


        // ==========================================
        // CREATE ORDER
        // ==========================================

        const createdOrders =
            await Order.create(

                [
                    {
                        buyer:
                            req.user._id,

                        products:
                            orderProducts,

                        transportFee:
                            savedPayment.transportFee,

                        totalAmount:
                            savedPayment.amount,

                        transactionId:
                            transactionId,

                        status:
                            "Processing",

                        delivery: {

                            fullname:
                                savedPayment.fullname,

                            phone:
                                savedPayment.phone,

                            whatsapp:
                                savedPayment.whatsapp,

                            state:
                                savedPayment.state,

                            address:
                                savedPayment.address
                        }
                    }
                ],

                {
                    session
                }
            );


        const order =
            createdOrders[0];


        // ==========================================
        // MARK PAYMENT SUCCESSFUL
        // ==========================================

        savedPayment.status =
            "Successful";

        savedPayment.transactionId =
            transactionId;


        await savedPayment.save({
            session
        });


        // ==========================================
        // CLEAR BUYER CART
        // ==========================================

        await Cart.deleteMany(
            {
                buyer:
                    req.user._id
            },

            {
                session
            }
        );


        // ==========================================
        // COMMIT EVERYTHING
        // ==========================================

        await session.commitTransaction();


        // ==========================================
        // SEND EMAIL NOTIFICATIONS
        //
        // IMPORTANT:
        // This happens AFTER the transaction commits.
        // An email failure will NOT cancel the order.
        // ==========================================

        try {

            // Get the complete order with
            // farmer information.
            const populatedOrder =
                await Order.findById(
                    order._id
                )
                    .populate({
                        path:
                            "products.product",

                        populate: {
                            path:
                                "farmer",

                            select:
                                "fullName email phone"
                        }
                    })
                    .populate(
                        "buyer",
                        "fullName email phone"
                    );


            if (populatedOrder) {

                // ==================================
                // GROUP PRODUCTS BY FARMER
                // ==================================

                const farmerGroups =
                    new Map();


                for (
                    const item
                    of populatedOrder.products
                ) {

                    const product =
                        item.product;


                    if (
                        !product ||
                        !product.farmer
                    ) {
                        continue;
                    }


                    const farmer =
                        product.farmer;


                    const farmerId =
                        farmer._id.toString();


                    if (
                        !farmerGroups.has(
                            farmerId
                        )
                    ) {

                        farmerGroups.set(
                            farmerId,

                            {
                                farmer,

                                items: []
                            }
                        );
                    }


                    farmerGroups
                        .get(farmerId)
                        .items
                        .push(item);
                }


                // ==================================
                // SEND EMAIL TO EACH FARMER
                // ==================================

                const farmerEmails = [];


                for (
                    const [
                        farmerId,
                        group
                    ]
                    of farmerGroups
                ) {

                    if (
                        !group.farmer.email
                    ) {
                        console.warn(
                            `Farmer ${farmerId} has no email address.`
                        );

                        continue;
                    }


                    farmerEmails.push(
                        sendOrderEmail({
                            to:
                                group.farmer.email,

                            recipientName:
                                group.farmer.fullName,

                            order:
                                populatedOrder,

                            items:
                                group.items,

                            recipientType:
                                "Farmer"
                        })
                    );
                }


                // ==================================
                // FIND ADMINS
                // ==================================

                const admins =
                    await User.find({
                        role:
                            "Admin"
                    }).select(
                        "fullName email"
                    );


                const adminRecipients =
                    new Map();


                // Admins registered in MongoDB
                for (
                    const admin
                    of admins
                ) {

                    if (
                        admin.email
                    ) {

                        adminRecipients.set(
                            admin.email.toLowerCase(),

                            {
                                email:
                                    admin.email,

                                name:
                                    admin.fullName
                            }
                        );
                    }
                }


                // Admin emails from .env
                const envAdminEmails =
                    (
                        process.env.ADMIN_EMAILS ||
                        ""
                    )
                        .split(",")
                        .map(
                            email =>
                                email.trim()
                        )
                        .filter(Boolean);


                for (
                    const email
                    of envAdminEmails
                ) {

                    const normalizedEmail =
                        email.toLowerCase();


                    if (
                        !adminRecipients.has(
                            normalizedEmail
                        )
                    ) {

                        adminRecipients.set(
                            normalizedEmail,

                            {
                                email,

                                name:
                                    "Admin"
                            }
                        );
                    }
                }


                // ==================================
                // SEND EMAIL TO EACH ADMIN
                // ==================================

                const adminEmails =
                    Array.from(
                        adminRecipients.values()
                    )
                        .map(admin =>
                            sendOrderEmail({

                                to:
                                    admin.email,

                                recipientName:
                                    admin.name,

                                order:
                                    populatedOrder,

                                items:
                                    populatedOrder.products,

                                recipientType:
                                    "Admin"
                            })
                        );


                // ==================================
                // SEND ALL EMAILS
                //
                // Promise.allSettled means one
                // failed email doesn't prevent
                // the others from being sent.
                // ==================================

                const emailResults =
                    await Promise.allSettled([
                        ...farmerEmails,
                        ...adminEmails
                    ]);


                emailResults.forEach(
                    result => {

                        if (
                            result.status ===
                            "rejected"
                        ) {

                            console.error(
                                "ORDER EMAIL FAILED:",
                                result.reason
                            );
                        }
                    }
                );


                console.log(
                    `Order ${populatedOrder._id}: email notifications processed.`
                );
            }

        } catch (emailError) {

            // Email errors must NEVER make a
            // successful order look unsuccessful.

            console.error(
                "ORDER EMAIL NOTIFICATION ERROR:",
                emailError
            );
        }


        // ==========================================
        // SEND SUCCESS RESPONSE
        // ==========================================

        res.json({

            success: true,

            message:
                "Payment verified and order created successfully.",

            order
        });


    } catch (error) {

        if (session) {

            try {

                await session.abortTransaction();

            } catch (abortError) {

                console.error(
                    "TRANSACTION ABORT ERROR:",
                    abortError
                );
            }
        }


        console.error(
            "VERIFY PAYMENT ERROR:",
            error.response?.data ||
            error.message ||
            error
        );


        res.status(500).json({

            message:
                error.response?.data?.message ||
                error.message ||
                "Payment verification failed."
        });


    } finally {

        if (session) {
            session.endSession();
        }
    }
};