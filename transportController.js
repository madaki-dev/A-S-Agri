const Transport = require("./Transport");
const TransportSettings = require("./TransportSettings");
const Product = require("./product");

const {
    calculateTransport,
    getTransportSettings
} = require("./transportCalculator");


// --------------------------------------------------
// REGEX ESCAPER
// --------------------------------------------------

function escapeRegex(value) {

    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


// --------------------------------------------------
// GET ALL ROUTES
// --------------------------------------------------

exports.getTransport = async (req, res) => {

    try {

        const routes =
            await Transport.find()
                .sort({
                    origin: 1,
                    destination: 1
                });

        res.json(routes);

    } catch (error) {

        console.error(
            "GET TRANSPORT ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load transport routes."
        });

    }

};


// --------------------------------------------------
// GET ROUTES
// --------------------------------------------------

exports.getTransportPrices = async (req, res) => {

    try {

        const routes =
            await Transport.find()
                .sort({
                    origin: 1,
                    destination: 1
                });

        res.json(routes);

    } catch (error) {

        console.error(
            "GET TRANSPORT PRICES ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load transport routes."
        });

    }

};


// --------------------------------------------------
// GET UNIQUE STATES
// --------------------------------------------------

exports.getTransportStates = async (req, res) => {

    try {

        const states =
            await Transport.distinct(
                "destination"
            );

        states.sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        );

        res.json(states);

    } catch (error) {

        console.error(
            "GET TRANSPORT STATES ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load transport states."
        });

    }

};


// --------------------------------------------------
// GET ONE ROUTE
// --------------------------------------------------

exports.getTransportRoute = async (
    req,
    res
) => {

    try {

        const origin =
            decodeURIComponent(
                req.params.origin
            ).trim();

        const destination =
            decodeURIComponent(
                req.params.destination
            ).trim();


        if (!origin || !destination) {

            return res.status(400).json({
                message:
                    "Origin and destination are required."
            });

        }


        const route =
            await Transport.findOne({

                origin: {
                    $regex:
                        `^${escapeRegex(origin)}$`,
                    $options: "i"
                },

                destination: {
                    $regex:
                        `^${escapeRegex(destination)}$`,
                    $options: "i"
                }

            });


        if (!route) {

            return res.status(404).json({
                message:
                    "Transport route not found."
            });

        }


        res.json(route);

    } catch (error) {

        console.error(
            "GET TRANSPORT ROUTE ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load transport route."
        });

    }

};


// --------------------------------------------------
// UPDATE ROUTE
// --------------------------------------------------

exports.updateTransportPrice = async (
    req,
    res
) => {

    try {

        const {
            basePrice,
            currentPrice,
            travelTime
        } = req.body;


        const update = {};


        if (
            basePrice !== undefined
        ) {

            const value =
                Number(basePrice);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {

                return res.status(400).json({
                    message:
                        "Base price must be a valid non-negative number."
                });

            }

            update.basePrice = value;

        }


        if (
            currentPrice !== undefined
        ) {

            const value =
                Number(currentPrice);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {

                return res.status(400).json({
                    message:
                        "Current price must be a valid non-negative number."
                });

            }

            update.currentPrice = value;

        }


        if (
            travelTime !== undefined
        ) {

            update.travelTime =
                String(
                    travelTime || ""
                ).trim();

        }


        if (
            !Object.keys(update).length
        ) {

            return res.status(400).json({
                message:
                    "No valid fields were supplied."
            });

        }


        const route =
            await Transport.findByIdAndUpdate(
                req.params.id,
                update,
                {
                    new: true,
                    runValidators: true
                }
            );


        if (!route) {

            return res.status(404).json({
                message:
                    "Transport route not found."
            });

        }


        res.json({
            success: true,
            message:
                "Transport route updated successfully.",
            route
        });

    } catch (error) {

        console.error(
            "UPDATE TRANSPORT ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to update transport route."
        });

    }

};


// --------------------------------------------------
// GET TRANSPORT SETTINGS
// --------------------------------------------------

exports.getTransportSettings = async (
    req,
    res
) => {

    try {

        const settings =
            await getTransportSettings();

        res.json(settings);

    } catch (error) {

        console.error(
            "GET TRANSPORT SETTINGS ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load transport settings."
        });

    }

};


// --------------------------------------------------
// UPDATE TRANSPORT SETTINGS
// --------------------------------------------------

exports.updateTransportSettings = async (
    req,
    res
) => {

    try {

        const allowedFields = [
            "baseDieselPrice",
            "currentDieselPrice",
            "truckRatePerTonne",
            "fuelSensitivity",
            "intraStatePerTenBags"
        ];


        const update = {};


        for (
            const field
            of allowedFields
        ) {

            if (
                req.body[field] !== undefined
            ) {

                const value =
                    Number(
                        req.body[field]
                    );


                if (
                    !Number.isFinite(value)
                ) {

                    return res.status(400).json({
                        message:
                            `${field} must be a valid number.`
                    });

                }


                update[field] = value;

            }

        }


        if (
            update.baseDieselPrice !== undefined &&
            update.baseDieselPrice <= 0
        ) {

            return res.status(400).json({
                message:
                    "Base diesel price must be greater than zero."
            });

        }


        if (
            update.currentDieselPrice !== undefined &&
            update.currentDieselPrice < 0
        ) {

            return res.status(400).json({
                message:
                    "Current diesel price cannot be negative."
            });

        }


        if (
            update.truckRatePerTonne !== undefined &&
            update.truckRatePerTonne < 0
        ) {

            return res.status(400).json({
                message:
                    "Truck rate cannot be negative."
            });

        }


        if (
            update.intraStatePerTenBags !== undefined &&
            update.intraStatePerTenBags < 0
        ) {

            return res.status(400).json({
                message:
                    "Intra-state price cannot be negative."
            });

        }


        if (
            update.fuelSensitivity !== undefined &&
            (
                update.fuelSensitivity < 0 ||
                update.fuelSensitivity > 1
            )
        ) {

            return res.status(400).json({
                message:
                    "Fuel sensitivity must be between 0 and 1."
            });

        }


        if (
            !Object.keys(update).length
        ) {

            return res.status(400).json({
                message:
                    "No valid settings were supplied."
            });

        }


        const settings =
            await TransportSettings.findOneAndUpdate(
                {
                    key: "default"
                },
                {
                    $set: update
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    runValidators: true
                }
            );


        res.json({
            success: true,
            message:
                "Transport settings updated successfully.",
            settings
        });

    } catch (error) {

        console.error(
            "UPDATE TRANSPORT SETTINGS ERROR:",
            error
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to update transport settings."
        });

    }

};


// --------------------------------------------------
// CALCULATE TRANSPORT
// --------------------------------------------------

exports.calculateTransport = async (req, res) => {
    try {
        const {
            cart,
            destination
        } = req.body;

        if (!Array.isArray(cart) || !cart.length) {
            return res.status(400).json({
                message: "Cart is empty."
            });
        }

        if (!destination) {
            return res.status(400).json({
                message: "Destination state is required."
            });
        }

        const productIds = cart.map(item => item.productId);

        const products = await Product.find({
            _id: { $in: productIds }
        }).lean();

        const productMap = new Map(
            products.map(product => [
                String(product._id),
                product
            ])
        );

        const items = [];

        for (const cartItem of cart) {
            const product = productMap.get(
                String(cartItem.productId)
            );

            if (!product) {
                return res.status(404).json({
                    message:
                        "One or more products in the cart could not be found."
                });
            }

            const quantity = Number(cartItem.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Cart contains an invalid quantity."
                });
            }

            items.push({
                product,
                quantity
            });
        }

        const result = await calculateTransport(
            items,
            destination
        );

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error(
            "CALCULATE TRANSPORT ERROR:",
            error
        );

        return res.status(400).json({
            message:
                error.message ||
                "Failed to calculate transport."
        });
    }
};

exports.getTransportLocations = async (req, res) => {
    try {
        const routes = await Transport.find({})
            .select("origin destination -_id")
            .lean();

        const locations = new Set();

        for (const route of routes) {
            locations.add(route.origin);
            locations.add(route.destination);
        }

        return res.status(200).json(
            Array.from(locations).sort()
        );

    } catch (error) {

        console.error(
            "Get transport locations error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to load transport locations."
        });
    }
};