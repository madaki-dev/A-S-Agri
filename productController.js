const Product = require("./product");


exports.createProduct = async (req, res) => {
    try {

        const {
            productName,
            category,
            quantity,
            location,
            description,
            price
        } = req.body;

        if (
            !productName ||
            !category ||
            !quantity ||
            !location ||
            !description ||
            !price
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (!req.file || !req.file.path) {
            return res.status(400).json({
                message: "Product image is required."
            });
        }

        const numericQuantity = Number(quantity);
        const farmerPrice = Number(price);

        if (
            !Number.isInteger(numericQuantity) ||
            numericQuantity <= 0
        ) {
            return res.status(400).json({
                message: "Quantity must be a whole number greater than 0."
            });
        }

        if (
            !Number.isFinite(farmerPrice) ||
            farmerPrice <= 0
        ) {
            return res.status(400).json({
                message: "Price must be greater than 0."
            });
        }

        // A&S commission = 10%
        const commission = farmerPrice * 0.10;

        const sellingPrice =
            farmerPrice + commission;

        const product = await Product.create({

            farmer: req.user._id,

            productName: productName.trim(),

            category: category.trim(),

            quantity: numericQuantity,

            stock: numericQuantity,

            location: location.trim(),

            description: description.trim(),

            image: req.file.path,

            farmerPrice,

            commission,

            sellingPrice
        });

        res.status(201).json({
            message: "Product uploaded successfully.",
            product
        });

    } catch (error) {

        console.error("CREATE PRODUCT ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};


exports.getProducts = async (req, res) => {
    try {

        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = 12;

        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.search) {

            filter.productName = {
                $regex: req.query.search.trim(),
                $options: "i"
            };

        }

        const totalProducts =
            await Product.countDocuments(filter);

        const totalPages =
            Math.ceil(totalProducts / limit);

        const products = await Product.find(filter)
            .populate(
                "farmer",
                "fullName phone"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.setHeader(
            "X-Current-Page",
            page
        );

        res.setHeader(
            "X-Total-Pages",
            totalPages
        );

        res.json(products);

    } catch (error) {

        console.error("GET PRODUCTS ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error."
        });
    }
};