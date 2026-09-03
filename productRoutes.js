const express = require("express");
const router = express.Router();

const Product = require("./product");

const {
    createProduct,
    getProducts
} = require("./productController");

const protect = require("./authMiddleware");
const farmerOnly = require("./farmerMiddleware");

const {
    upload,
    uploadToCloudinary
} = require("./Uploads/uploads");


// ==========================================
// CREATE PRODUCT
// ==========================================

router.post(
    "/",
    protect,
    farmerOnly,
    upload.single("image"),
    uploadToCloudinary("as-ventures/products"),
    createProduct
);


// ==========================================
// GET ALL PRODUCTS
// ==========================================

router.get(
    "/",
    getProducts
);


// ==========================================
// GET ONE PRODUCT
// ==========================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const product =
                await Product
                    .findById(req.params.id)
                    .populate(
                        "farmer",
                        "fullName phone"
                    );

            if (!product) {

                return res.status(404).json({
                    message: "Product not found"
                });

            }

            res.json(product);

        } catch (error) {

            console.error(
                "GET PRODUCT ERROR:",
                error
            );

            res.status(500).json({
                message: error.message
            });

        }

    }
);

// ==========================================
// DELETE PRODUCT
// ==========================================

router.delete(
    "/:id",
    protect,
    farmerOnly,
    async (req, res) => {

        try {

            const product =
                await Product.findById(req.params.id);

            if (!product) {

                return res.status(404).json({
                    message: "Product not found."
                });

            }


            // ======================================
            // GET LOGGED-IN FARMER ID
            // ======================================

            const farmerId =
                req.user.id ||
                req.user._id;


            // ======================================
            // CHECK PRODUCT OWNERSHIP
            // ======================================

            if (
                !product.farmer ||
                product.farmer.toString() !==
                farmerId.toString()
            ) {

                return res.status(403).json({
                    message:
                        "You are not authorized to delete this product."
                });

            }


            // ======================================
            // DELETE PRODUCT
            // ======================================

            await Product.findByIdAndDelete(
                req.params.id
            );


            res.status(200).json({
                message:
                    "Product deleted successfully."
            });


        } catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );


            res.status(500).json({
                message:
                    "Server error while deleting product."
            });

        }

    }
);

module.exports = router;