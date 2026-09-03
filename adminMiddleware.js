require("dotenv").config();

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not Authorized" });
    }

    // Read allowed emails from env
    const allowedAdmins = process.env.ADMIN_EMAILS.split(",");

    if (!allowedAdmins.includes(req.user.email)) {
        return res.status(403).json({ message: "Admin Access Only" });
    }

    next();
};

module.exports = adminOnly;
