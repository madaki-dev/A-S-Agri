const Cart = require("./Cart");
const Product = require("./product");


// ============================================================
// ADD TO CART
// ============================================================

exports.addToCart = async (req, res) => {

    try {

        const buyerId =
            req.user._id;

        const {
            productId,
            quantity
        } = req.body;


        const requestedQuantity =
            Number(quantity);


        if (!productId) {

            return res.status(400).json({

                message:
                    "Product ID is required."
            });
        }


        if (
            !Number.isInteger(
                requestedQuantity
            ) ||
            requestedQuantity < 1
        ) {

            return res.status(400).json({

                message:
                    "Quantity must be at least 1."
            });
        }


        const product =
            await Product.findById(
                productId
            );


        if (!product) {

            return res.status(404).json({

                message:
                    "Product not found."
            });
        }


        if (
            product.stock <= 0
        ) {

            return res.status(400).json({

                message:
                    "This product is out of stock."
            });
        }


        const existingCartItem =
            await Cart.findOne({

                buyer:
                    buyerId,

                product:
                    productId
            });


        if (existingCartItem) {

            const newQuantity =
                existingCartItem.quantity +
                requestedQuantity;


            if (
                newQuantity >
                product.stock
            ) {

                return res.status(400).json({

                    message:
                        `Only ${product.stock} item(s) available in stock.`
                });
            }


            existingCartItem.quantity =
                newQuantity;


            await existingCartItem.save();


            const updatedCart =
                await Cart.findById(
                    existingCartItem._id
                ).populate(
                    "product"
                );


            return res.status(200).json({

                message:
                    "Cart quantity updated.",

                cart:
                    updatedCart
            });
        }


        if (
            requestedQuantity >
            product.stock
        ) {

            return res.status(400).json({

                message:
                    `Only ${product.stock} item(s) available in stock.`
            });
        }


        const cartItem =
            await Cart.create({

                buyer:
                    buyerId,

                product:
                    productId,

                quantity:
                    requestedQuantity
            });


        const populatedCart =
            await Cart.findById(
                cartItem._id
            ).populate(
                "product"
            );


        res.status(201).json({

            message:
                "Product added to cart.",

            cart:
                populatedCart
        });


    } catch (error) {

        console.error(
            "ADD TO CART ERROR:",
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
// GET CART
// ============================================================

exports.getCart = async (req, res) => {

    try {

        const cart =
            await Cart.find({
                buyer:
                    req.user._id
            })
                .populate(
                    "product"
                );


        res.json(
            cart
        );


    } catch (error) {

        console.error(
            "GET CART ERROR:",
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
// REMOVE CART ITEM
// ============================================================

exports.removeItem = async (req, res) => {

    try {

        const cartItem =
            await Cart.findOneAndDelete({

                _id:
                    req.params.id,

                buyer:
                    req.user._id
            });


        if (!cartItem) {

            return res.status(404).json({

                message:
                    "Cart item not found."
            });
        }


        res.json({

            message:
                "Item removed from cart."
        });


    } catch (error) {

        console.error(
            "REMOVE CART ITEM ERROR:",
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};