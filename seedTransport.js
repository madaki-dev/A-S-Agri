const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

require("dotenv").config();

const mongoose = require("mongoose");
const Transport = require("./Transport");
const transportRoutes = require("./transportRoutesData");


/*
=========================================================
EXPECTED LOCATIONS
=========================================================
*/

const LOCATIONS = [
    "FCT",
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara"
];

const EXPECTED_ROUTE_COUNT = 1332;


/*
=========================================================
NORMALIZE LOCATION NAME
=========================================================
*/

const normalize = (value) =>
    String(value || "").trim().toLowerCase();


/*
=========================================================
VALIDATE SOURCE DATA
=========================================================
*/

function validateRoutes() {

    if (!Array.isArray(transportRoutes)) {
        throw new Error(
            "transportRoutesData.js must export an array."
        );
    }

    const routeKeys = new Set();
    const duplicateRoutes = [];

    const routesByOrigin = new Map();

    for (const location of LOCATIONS) {
        routesByOrigin.set(normalize(location), []);
    }


    /*
    -----------------------------------------------------
    CHECK EACH ROUTE
    -----------------------------------------------------
    */

    for (const route of transportRoutes) {

        if (!route || typeof route !== "object") {
            throw new Error(
                "Invalid route entry found."
            );
        }

        const {
            origin,
            destination,
            basePrice,
            currentPrice
        } = route;


        if (!origin || !destination) {
            throw new Error(
                "A route is missing its origin or destination."
            );
        }


        if (
            !Number.isFinite(basePrice) ||
            basePrice < 0
        ) {
            throw new Error(
                `Invalid base price: ${origin} → ${destination}`
            );
        }


        if (
            !Number.isFinite(currentPrice) ||
            currentPrice < 0
        ) {
            throw new Error(
                `Invalid current price: ${origin} → ${destination}`
            );
        }


        const originKey = normalize(origin);
        const destinationKey = normalize(destination);


        /*
        -------------------------------------------------
        SELF ROUTE
        -------------------------------------------------
        */

        if (originKey === destinationKey) {

            console.error(
                `❌ Invalid self-route: ${origin} → ${destination}`
            );

            continue;
        }


        /*
        -------------------------------------------------
        UNKNOWN LOCATION
        -------------------------------------------------
        */

        const validOrigin = LOCATIONS.some(
            location => normalize(location) === originKey
        );

        const validDestination = LOCATIONS.some(
            location => normalize(location) === destinationKey
        );


        if (!validOrigin) {

            console.error(
                `❌ Unknown origin: ${origin}`
            );

            continue;
        }


        if (!validDestination) {

            console.error(
                `❌ Unknown destination: ${destination}`
            );

            continue;
        }


        /*
        -------------------------------------------------
        DUPLICATE ROUTE
        -------------------------------------------------
        */

        const key = `${originKey}→${destinationKey}`;

        if (routeKeys.has(key)) {

            duplicateRoutes.push(
                `${origin} → ${destination}`
            );

        } else {

            routeKeys.add(key);
        }


        /*
        -------------------------------------------------
        STORE ROUTE UNDER ORIGIN
        -------------------------------------------------
        */

        if (!routesByOrigin.has(originKey)) {
            routesByOrigin.set(originKey, []);
        }

        routesByOrigin
            .get(originKey)
            .push(destinationKey);
    }


    /*
    =====================================================
    ROUTE COUNT
    =====================================================
    */

    console.log("");
    console.log("==========================================");
    console.log("ROUTE MATRIX CHECK");
    console.log("==========================================");
    console.log("");


    console.log(
        `Routes found:    ${transportRoutes.length}`
    );

    console.log(
        `Routes expected: ${EXPECTED_ROUTE_COUNT}`
    );

    console.log("");


    /*
    =====================================================
    CHECK EACH ORIGIN
    =====================================================
    */

    const missingRoutes = [];

    for (const origin of LOCATIONS) {

        const originKey = normalize(origin);

        const existingDestinations =
            new Set(
                routesByOrigin.get(originKey) || []
            );


        const missingDestinations = [];


        for (const destination of LOCATIONS) {

            const destinationKey =
                normalize(destination);


            /*
            ---------------------------------------------
            A STATE SHOULD NOT HAVE A ROUTE TO ITSELF
            ---------------------------------------------
            */

            if (destinationKey === originKey) {
                continue;
            }


            if (!existingDestinations.has(destinationKey)) {

                missingDestinations.push(
                    destination
                );

                missingRoutes.push({
                    origin,
                    destination
                });
            }
        }


        /*
        ---------------------------------------------
        ORIGIN SUMMARY
        ---------------------------------------------
        */

        const expectedForOrigin = 36;

        const actualForOrigin =
            existingDestinations.size;


        if (actualForOrigin === expectedForOrigin) {

            console.log(
                `✅ ${origin}: ${actualForOrigin}/36`
            );

        } else {

            console.log(
                `❌ ${origin}: ${actualForOrigin}/36`
            );


            if (missingDestinations.length > 0) {

                console.log(
                    `   Missing: ${missingDestinations.join(", ")}`
                );
            }
        }
    }


    /*
    =====================================================
    DUPLICATES
    =====================================================
    */

    if (duplicateRoutes.length > 0) {

        console.log("");
        console.log("==========================================");
        console.log("DUPLICATE ROUTES");
        console.log("==========================================");

        for (const route of duplicateRoutes) {

            console.log(
                `❌ ${route}`
            );
        }
    }


    /*
    =====================================================
    MISSING ROUTES
    =====================================================
    */

    if (missingRoutes.length > 0) {

        console.log("");
        console.log("==========================================");
        console.log("ALL MISSING ROUTES");
        console.log("==========================================");
        console.log("");

        for (const route of missingRoutes) {

            console.log(
                `❌ ${route.origin} → ${route.destination}`
            );
        }
    }


    /*
    =====================================================
    FINAL RESULT
    =====================================================
    */

    console.log("");
    console.log("==========================================");
    console.log("VALIDATION RESULT");
    console.log("==========================================");

    console.log(
        `Total routes found: ${transportRoutes.length}`
    );

    console.log(
        `Total routes expected: ${EXPECTED_ROUTE_COUNT}`
    );

    console.log(
        `Missing routes: ${missingRoutes.length}`
    );

    console.log(
        `Duplicate routes: ${duplicateRoutes.length}`
    );


    /*
    -----------------------------------------------------
    STOP IF INVALID
    -----------------------------------------------------
    */

    if (
        transportRoutes.length !== EXPECTED_ROUTE_COUNT ||
        missingRoutes.length > 0 ||
        duplicateRoutes.length > 0
    ) {

        console.log("");
        console.log(
            "❌ Transport route data is incomplete."
        );

        console.log(
            "❌ MongoDB was NOT modified."
        );

        return false;
    }


    console.log("");
    console.log(
        "✅ All 1,332 directional routes are present."
    );

    console.log(
        "✅ No duplicate routes found."
    );

    console.log(
        "✅ Route matrix is complete."
    );

    return true;
}


/*
=========================================================
PREPARE ROUTES FOR MONGODB
=========================================================
*/

const routes = transportRoutes.map((route) => ({
    origin: route.origin.trim(),
    destination: route.destination.trim(),
    basePrice: route.basePrice,
    currentPrice: route.currentPrice,
    travelTime: route.travelTime || ""
}));


/*
=========================================================
DATABASE SEED
=========================================================
*/

async function seedDatabase() {

    /*
    -----------------------------------------------------
    VALIDATE BEFORE TOUCHING MONGODB
    -----------------------------------------------------
    */

    const isValid = validateRoutes();

    if (!isValid) {

        process.exitCode = 1;

        return;
    }


    try {

        console.log("");
        console.log("Connecting to MongoDB...");

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB Connected"
        );


        /*
        -------------------------------------------------
        DELETE OLD TRANSPORT DATA
        -------------------------------------------------
        */

        await Transport.deleteMany({});

        console.log(
            "Old transport records deleted."
        );


        /*
        -------------------------------------------------
        INSERT NEW TRANSPORT DATA
        -------------------------------------------------
        */

        await Transport.insertMany(routes);

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "✅ TRANSPORT SEED SUCCESSFUL"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `✅ Total routes inserted: ${routes.length}`
        );

        console.log(
            "✅ Full 1,332-route matrix seeded."
        );

    } catch (error) {

        console.error("");
        console.error(
            "❌ Transport seed failed:"
        );

        console.error(error);

        process.exitCode = 1;

    } finally {

        await mongoose.connection.close();

        console.log("");
        console.log(
            "MongoDB connection closed."
        );
    }
}


/*
=========================================================
START
=========================================================
*/

seedDatabase();