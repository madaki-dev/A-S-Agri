const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config");

const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const paymentRoutes = require("./paymentRoutes");
const orderRoutes = require("./orderRoutes");
const transportRoutes = require("./transportRoutes");
const adminRoutes = require("./adminRoutes");
const farmerDashboardRoutes = require("./farmerDashboardRoutes");
const profileRoutes = require("./profileRoutes");
const contactRoutes = require("./contactRoutes");


const app = express();


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/payment",
    paymentRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/transport",
    transportRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/farmer-dashboard",
    farmerDashboardRoutes
);

app.use(
    "/api/profile",
    profileRoutes
);

app.use(
    "/api/contact",
    contactRoutes
);


// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success: true,
            message: "A&S Agri backend is running."
        });

    }
);


// --------------------------------------------------
// Frontend
// --------------------------------------------------

app.use(
    express.static(
        path.join(
            __dirname,
            "..",
            "Frontend"
        )
    )
);


// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use(
    (err, req, res, next) => {

        console.error(
            "GLOBAL ERROR:",
            err
        );

        res.status(
            err.status || 500
        ).json({

            message:
                err.message ||
                "Internal server error."
        });

    }
);


// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT =
    process.env.PORT || 3000;


const startServer = async () => {

    try {

        await connectDB();

        app.listen(
            PORT,
            () => {

                console.log(
                    `A&S Agri server running on port ${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "DATABASE CONNECTION FAILED:",
            error
        );

        process.exit(1);
    }
};


startServer();