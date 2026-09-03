const farmerOnly = (req, res, next) => {

    if (req.user.accountType !== "Farmer") {
        return res.status(403).json({

            message: "Only farmers can perform this action."
        });
    }

    next();
};

module.exports = farmerOnly;