const axios = require("axios");
const Payment = require("./payment");
const Order = require("./Order");
const Product = require("./product");
const User = require("./User");
const { calculateTransport } = require("./transportCalculator");

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;


/* =========================================================
   INITIALIZE PAYMENT
========================================================= */

const initializePayment = async (req, res) => {
    try {
        const {
            fullname,
            phone,
            whatsapp,
            state,
            address,
            cart
        } = req.body;

        if (
            !fullname ||
            !phone ||
            !whatsapp ||
            !state ||
            !address
        ) {
            return res.status(400).json({
                message: "All delivery information is required."
            });
        }

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty."
            });
        }

        const normalizedState = state.trim();

        /*
         * Get the real products from MongoDB.
         * Never trust prices or stock sent by the frontend.
         */

        const productIds = cart.map(
            (item) => item.productId
        );

        const products = await Product.find({
            _id: { $in: productIds }
        });

        if (products.length !== cart.length) {
            return res.status(400).json({
                message:
                    "One or more products in your cart no longer exist."
            });
        }

        const productMap = new Map(
            products.map((product) => [
                product._id.toString(),
                product
            ])
        );

        let productsTotal = 0;

        const paymentProducts = [];

        /*
         * Validate every cart item.
         */

        for (const cartItem of cart) {
            const product = productMap.get(
                String(cartItem.productId)
            );

            if (!product) {
                return res.status(400).json({
                    message:
                        "A product in your cart no longer exists."
                });
            }

            const quantity = Number(cartItem.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message:
                        `Invalid quantity for ${product.productName}.`
                });
            }

            if (quantity > product.stock) {
                return res.status(400).json({
                    message:
                        `Only ${product.stock} unit(s) of ${product.productName} are available.`
                });
            }

            const sellingPrice = Number(
                product.sellingPrice
            );

            if (
                !Number.isFinite(sellingPrice) ||
                sellingPrice < 0
            ) {
                return res.status(400).json({
                    message:
                        `Invalid price for ${product.productName}.`
                });
            }

            const farmerPrice = Number(
                product.farmerPrice
            );

            const commission = Number(
                product.commission
            );

            if (
                !Number.isFinite(farmerPrice) ||
                farmerPrice < 0
            ) {
                return res.status(400).json({
                    message:
                        `Invalid farmer price for ${product.productName}.`
                });
            }

            if (
                !Number.isFinite(commission) ||
                commission < 0
            ) {
                return res.status(400).json({
                    message:
                        `Invalid commission for ${product.productName}.`
                });
            }

            const itemTotal =
                sellingPrice * quantity;

            productsTotal += itemTotal;

            paymentProducts.push({
                product: product._id,
                quantity,
                farmer: product.farmer,
                farmerPrice,
                commission,
                sellingPrice
            });
        }


        /* =====================================================
           TRANSPORT CALCULATION
        ===================================================== */

        let transportResult;

        try {
            const transportItems = cart.map(
                (cartItem) => {
                    const product = productMap.get(
                        String(cartItem.productId)
                    );

                    return {
                        product,
                        quantity: Number(
                            cartItem.quantity
                        )
                    };
                }
            );

            transportResult =
                await calculateTransport(
                    transportItems,
                    normalizedState
                );

        } catch (transportError) {
            return res.status(400).json({
                message: transportError.message
            });
        }

        const transportFee = Number(
            transportResult.transportFee
        );

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

        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {
            return res.status(400).json({
                message:
                    "Invalid payment amount."
            });
        }


        /* =====================================================
           TRANSACTION REFERENCE
        ===================================================== */

        const tx_ref =
            `AS-${Date.now()}-${req.user._id}`;


        /* =====================================================
           SAVE PAYMENT
        ===================================================== */

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

                transportBreakdown:
                    transportResult.transportBreakdown,

                dieselPrice:
                    transportResult.dieselPrice,

                fuelMultiplier:
                    transportResult.fuelMultiplier,

                products:
                    paymentProducts,

                status: "Pending"
            });


        /* =====================================================
           FLUTTERWAVE
        ===================================================== */

        const flutterwaveResponse =
            await axios.post(
                "https://api.flutterwave.com/v3/payments",

                {
                    tx_ref,

                    amount: totalAmount,

                    currency: "NGN",

                    redirect_url:
                        "https://a-s-ventures.vercel.app/payment-success.html",

                    customer: {
                        email: req.user.email,
                        phonenumber:
                            phone.trim(),
                        name:
                            fullname.trim()
                    },

                    customizations: {
                        title: "A&S Agri",
                        description:
                            "Agricultural marketplace order",
                        logo:
                            "https://as-agri.vercel.app/favicon.ico"
                    },

                    meta: {
                        paymentId:
                            savedPayment._id.toString(),

                        buyerId:
                            req.user._id.toString()
                    }
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${FLW_SECRET_KEY}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (
            !flutterwaveResponse.data ||
            flutterwaveResponse.data.status !==
            "success"
        ) {
            await Payment.findByIdAndUpdate(
                savedPayment._id,
                {
                    status: "Failed"
                }
            );

            return res.status(400).json({
                message:
                    "Unable to initialize payment."
            });
        }


        return res.status(200).json({

            message:
                "Payment initialized successfully.",

            paymentId:
                savedPayment._id,

            tx_ref,

            paymentLink:
                flutterwaveResponse.data.data.link,

            amount:
                totalAmount,

            productsTotal,

            transportFee,

            transportBreakdown:
                transportResult.transportBreakdown
        });


    } catch (error) {

        console.error(
            "Initialize payment error:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to initialize payment."
        });
    }
};


/* =========================================================
   VERIFY PAYMENT
========================================================= */

const verifyPayment = async (req, res) => {

    try {

        const { transactionId } =
            req.params;

        if (!transactionId) {
            return res.status(400).json({
                message:
                    "Transaction ID is required."
            });
        }


        /* =====================================================
           VERIFY WITH FLUTTERWAVE
        ===================================================== */

        const flutterwaveResponse =
            await axios.get(
                `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${FLW_SECRET_KEY}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const verification =
            flutterwaveResponse.data;


        if (
            !verification ||
            verification.status !== "success" ||
            !verification.data
        ) {
            return res.status(400).json({
                message:
                    "Payment verification failed."
            });
        }


        const transaction =
            verification.data;


        if (
            transaction.status !==
            "successful"
        ) {
            return res.status(400).json({
                message:
                    "Payment was not successful."
            });
        }


        if (
            transaction.currency !== "NGN"
        ) {
            return res.status(400).json({
                message:
                    "Invalid payment currency."
            });
        }


        /* =====================================================
           FIND SAVED PAYMENT
        ===================================================== */

        const savedPayment =
            await Payment.findOne({
                tx_ref:
                    transaction.tx_ref
            });


        if (!savedPayment) {
            return res.status(404).json({
                message:
                    "Payment record not found."
            });
        }


        /* =====================================================
           AUTHORIZATION
        ===================================================== */

        if (
            req.user &&
            savedPayment.buyer.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to verify this payment."
            });
        }


        /* =====================================================
           PREVENT DOUBLE VERIFICATION
        ===================================================== */

        if (
            savedPayment.status ===
            "Successful"
        ) {

            const existingOrder =
                await Order.findOne({
                    transactionId:
                        transaction.id
                });

            return res.status(200).json({
                message:
                    "Payment has already been verified.",

                order:
                    existingOrder
            });
        }


        /* =====================================================
           VERIFY AMOUNT
        ===================================================== */

        const paidAmount =
            Number(transaction.amount);

        const expectedAmount =
            Number(savedPayment.amount);


        if (
            !Number.isFinite(paidAmount) ||
            paidAmount !== expectedAmount
        ) {
            return res.status(400).json({
                message:
                    "Payment amount does not match the order amount."
            });
        }


        /* =====================================================
           GET FARMER INFORMATION
        ===================================================== */

        const farmerIds =
            savedPayment.products.map(
                (item) => item.farmer
            );

        const farmers =
            await User.find({
                _id: {
                    $in: farmerIds
                }
            });


        const farmerMap =
            new Map(
                farmers.map(
                    (farmer) => [
                        farmer._id.toString(),
                        farmer
                    ]
                )
            );


        /* =====================================================
           BUILD ORDER PRODUCTS
        ===================================================== */

        const orderProducts =
            savedPayment.products.map(
                (item) => ({

                    product:
                        item.product,

                    quantity:
                        item.quantity,

                    farmer:
                        item.farmer,

                    farmerPrice:
                        item.farmerPrice,

                    commission:
                        item.commission,

                    sellingPrice:
                        item.sellingPrice
                })
            );


        /* =====================================================
           BUILD FARMER PAYOUTS
        ===================================================== */

        const farmerPayoutMap =
            new Map();


        for (
            const item of
            savedPayment.products
        ) {

            const farmerId =
                item.farmer.toString();

            const farmer =
                farmerMap.get(
                    farmerId
                );


            const farmerAmount =
                Number(item.farmerPrice) *
                Number(item.quantity);


            const commissionAmount =
                Number(item.commission) *
                Number(item.quantity);


            if (
                !farmerPayoutMap.has(
                    farmerId
                )
            ) {

                farmerPayoutMap.set(
                    farmerId,
                    {
                        farmer:
                            item.farmer,

                        farmerName:
                            farmer?.fullName ||
                            farmer?.name ||
                            farmer?.fullname ||
                            "",

                        farmerPhone:
                            farmer?.phone ||
                            "",

                        accountNumber:
                            farmer?.accountNumber ||
                            "",

                        bankName:
                            farmer?.bankName ||
                            "",

                        accountName:
                            farmer?.accountName ||
                            "",

                        amount:
                            0,

                        commission:
                            0,

                        status:
                            "Pending",

                        paidAt:
                            null
                    }
                );
            }


            const payout =
                farmerPayoutMap.get(
                    farmerId
                );


            payout.amount +=
                farmerAmount;

            payout.commission +=
                commissionAmount;
        }


        const farmerPayouts =
            Array.from(
                farmerPayoutMap.values()
            );


        /* =====================================================
           CREATE ORDER
        ===================================================== */

        const order =
            await Order.create({

                buyer:
                    savedPayment.buyer,

                products:
                    orderProducts,

                transportFee:
                    savedPayment.transportFee,

                transportBreakdown:
                    savedPayment.transportBreakdown,

                dieselPrice:
                    savedPayment.dieselPrice,

                fuelMultiplier:
                    savedPayment.fuelMultiplier,

                totalAmount:
                    savedPayment.amount,

                transactionId:
                    String(transaction.id),

                status:
                    "Paid",

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
                },

                farmerPayouts
            });


        /* =====================================================
           REDUCE PRODUCT STOCK
        ===================================================== */

        for (
            const item of
            savedPayment.products
        ) {

            const updatedProduct =
                await Product.findOneAndUpdate(

                    {
                        _id:
                            item.product,

                        stock: {
                            $gte:
                                item.quantity
                        }
                    },

                    {
                        $inc: {
                            stock:
                                -item.quantity
                        }
                    },

                    {
                        new: true
                    }
                );


            if (!updatedProduct) {

                console.error(
                    `Unable to reduce stock for product ${item.product}`
                );
            }
        }


        /* =====================================================
           MARK PAYMENT SUCCESSFUL
        ===================================================== */

        savedPayment.status =
            "Successful";

        savedPayment.transactionId =
            String(transaction.id);

        await savedPayment.save();


        /* =====================================================
           RESPONSE
        ===================================================== */

        return res.status(200).json({

            message:
                "Payment verified successfully.",

            order
        });


    } catch (error) {

        console.error(
            "Verify payment error:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to verify payment."
        });
    }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    initializePayment,
    verifyPayment
};