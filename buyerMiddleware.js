const buyerOnly = (req, res, next) => {

    if (req.user.accountType !== "Buyer") {
        return res.status(403).json({

            message: "Only buyers can perform this action."

        });
    }

    next();
};

module.exports = buyerOnly;