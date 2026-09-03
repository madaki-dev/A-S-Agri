require("dotenv").config();

const User = require("./User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function createSafeUser(user) {
    return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        role: user.role
    };
}

function createToken(user) {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

exports.register = async (req, res) => {
    try {
        let {
            fullName,
            email,
            phone,
            password,
            confirmPassword,
            accountType
        } = req.body;

        fullName = fullName?.trim();
        email = email?.trim().toLowerCase();
        phone = phone?.trim();

        if (!fullName || !email || !phone || !password || !confirmPassword || !accountType) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (!["Buyer", "Farmer"].includes(accountType)) {
            return res.status(400).json({
                message: "Invalid account type."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match."
            });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(400).json({
                message: "Email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const allowedAdmins = (process.env.ADMIN_EMAILS || "")
            .split(",")
            .map(email => email.trim().toLowerCase())
            .filter(Boolean);

        const isAdmin = allowedAdmins.includes(email);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            accountType,
            role: isAdmin ? "Admin" : "User"
        });

        const safeUser = createSafeUser(user);
        const token = createToken(user);

        res.status(201).json({
            message: "Account Created",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error during registration."
        });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password."
            });
        }

        const token = createToken(user);
        const safeUser = createSafeUser(user);

        res.json({
            message: "Login Successful",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: error.message || "Server error during login."
        });
    }
};