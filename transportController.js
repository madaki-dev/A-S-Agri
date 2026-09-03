const Transport = require("./Transport");


// ============================================================
// CREATE TRANSPORT
// ============================================================

exports.createTransport = async (req, res) => {

    try {

        const {
            state,
            transportPrice
        } = req.body;


        if (
            !state ||
            transportPrice === undefined
        ) {

            return res.status(400).json({

                message:
                    "State and transport price are required."
            });
        }


        const price =
            Number(transportPrice);


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            return res.status(400).json({

                message:
                    "Transport price must be a valid number."
            });
        }


        const existing =
            await Transport.findOne({

                state: {
                    $regex:
                        `^${state.trim()}$`,
                    $options: "i"
                }
            });


        if (existing) {

            return res.status(400).json({

                message:
                    "Transport price for this state already exists."
            });
        }


        const transport =
            await Transport.create({

                state:
                    state.trim(),

                transportPrice:
                    price
            });


        res.status(201).json(
            transport
        );


    } catch (error) {

        console.error(
            "CREATE TRANSPORT ERROR:",
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
// GET ALL TRANSPORT
// ============================================================

exports.getTransport = async (req, res) => {

    try {

        const transport =
            await Transport.find()
                .sort({
                    state: 1
                });


        res.json(
            transport
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};



// ============================================================
// GET TRANSPORT PRICES
// ============================================================

exports.getTransportPrices = async (req, res) => {

    try {

        const prices =
            await Transport.find()
                .sort({
                    state: 1
                });


        res.json(
            prices
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};



// ============================================================
// UPDATE TRANSPORT PRICE
// ============================================================

exports.updateTransportPrice = async (req, res) => {

    try {

        const price =
            Number(
                req.body.transportPrice
            );


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            return res.status(400).json({

                message:
                    "Transport price must be a valid number."
            });
        }


        const transport =
            await Transport.findByIdAndUpdate(

                req.params.id,

                {
                    transportPrice:
                        price
                },

                {
                    new: true,
                    runValidators: true
                }
            );


        if (!transport) {

            return res.status(404).json({

                message:
                    "Transport record not found."
            });
        }


        res.json(
            transport
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};



// ============================================================
// GET PRICE FOR ONE STATE
// ============================================================

exports.getTransportPriceByState = async (req, res) => {

    try {

        const state =
            decodeURIComponent(
                req.params.state
            ).trim();


        const transport =
            await Transport.findOne({

                state: {

                    $regex:
                        `^${state}$`,

                    $options: "i"
                }
            });


        if (!transport) {

            return res.status(404).json({

                message:
                    "Transport price not found for this state."
            });
        }


        res.json(
            transport
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message ||
                "Server error."
        });
    }
};