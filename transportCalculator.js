const Transport = require("./Transport");
const TransportSettings = require("./TransportSettings");

// --------------------------------------------------
// DEFAULT SETTINGS
// --------------------------------------------------

const DEFAULT_SETTINGS = {
    key: "default",
    baseDieselPrice: 1662,
    currentDieselPrice: 1662,
    truckRatePerTonne: 46228,
    fuelSensitivity: 0.6,
    intraStatePerTenBags: 8000
};

// --------------------------------------------------
// TRANSPORT SETTINGS
// --------------------------------------------------

async function getTransportSettings() {
    let settings = await TransportSettings.findOne({ key: "default" });

    if (!settings) {
        settings = await TransportSettings.create(DEFAULT_SETTINGS);
    }

    return settings;
}

// --------------------------------------------------
// FUEL MULTIPLIER
// --------------------------------------------------

function calculateFuelMultiplier(settings) {
    const base = Number(settings.baseDieselPrice);
    const current = Number(settings.currentDieselPrice);
    const sensitivity = Number(settings.fuelSensitivity);

    if (!Number.isFinite(base) || base <= 0) {
        throw new Error("Invalid base diesel price.");
    }

    if (!Number.isFinite(current) || current < 0) {
        throw new Error("Invalid current diesel price.");
    }

    if (
        !Number.isFinite(sensitivity) ||
        sensitivity < 0 ||
        sensitivity > 1
    ) {
        throw new Error("Invalid fuel sensitivity.");
    }

    return 1 + ((current / base) - 1) * sensitivity;
}

// --------------------------------------------------
// STATE NORMALIZATION
// --------------------------------------------------
// This makes these equivalent:
//
// "Niger"
// "Niger State"
// "niger"
// " NIGER STATE "
//
// It also handles FCT / Abuja.

function normalizeState(value) {
    const state = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const aliases = {
        // States
        "abia state": "abia",
        "adamawa state": "adamawa",
        "akwa ibom state": "akwa ibom",
        "anambra state": "anambra",
        "bauchi state": "bauchi",
        "bayelsa state": "bayelsa",
        "benue state": "benue",
        "borno state": "borno",
        "cross river state": "cross river",
        "delta state": "delta",
        "ebonyi state": "ebonyi",
        "edo state": "edo",
        "ekiti state": "ekiti",
        "enugu state": "enugu",
        "gombe state": "gombe",
        "imo state": "imo",
        "jigawa state": "jigawa",
        "kaduna state": "kaduna",
        "kano state": "kano",
        "katsina state": "katsina",
        "kebbi state": "kebbi",
        "kogi state": "kogi",
        "kwara state": "kwara",
        "lagos state": "lagos",
        "nasarawa state": "nasarawa",
        "niger state": "niger",
        "ogun state": "ogun",
        "ondo state": "ondo",
        "osun state": "osun",
        "oyo state": "oyo",
        "plateau state": "plateau",
        "rivers state": "rivers",
        "sokoto state": "sokoto",
        "taraba state": "taraba",
        "yobe state": "yobe",
        "zamfara state": "zamfara",

        // FCT
        "federal capital territory": "fct",
        "federal capital territory state": "fct",
        "fct": "fct",
        "abuja": "fct",
        "abuja state": "fct"
    };

    return aliases[state] || state;
}

// --------------------------------------------------
// REGEX ESCAPE
// --------------------------------------------------

function escapeRegex(value) {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

// --------------------------------------------------
// CALCULATE TRANSPORT
// --------------------------------------------------

async function calculateTransport(items, destination) {
    if (!Array.isArray(items) || !items.length) {
        throw new Error("Cart is empty.");
    }

    if (!destination) {
        throw new Error("Destination state is required.");
    }

    const settings = await getTransportSettings();

    const fuelMultiplier = calculateFuelMultiplier(settings);

    // Normalize the destination ONCE.
    //
    // Example:
    // "Niger State" -> "niger"
    // "Niger"       -> "niger"
    //
    const normalizedDestination = normalizeState(destination);

    const groups = {};

    // --------------------------------------------------
    // GROUP CART ITEMS BY ORIGIN STATE
    // --------------------------------------------------

    for (const item of items) {
        const product = item.product;

        if (!product) {
            continue;
        }

        const origin = String(
            product.location || product.state || ""
        ).trim();

        if (!origin) {
            throw new Error(
                `Product "${product.productName || "Unknown"}" has no origin state.`
            );
        }

        const quantity = Number(item.quantity || 0);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            continue;
        }

        const weightPerUnitKg = Number(
            product.weightPerUnitKg || 0
        );

        // Keep the original display value,
        // but use normalized value for calculations/database matching.
        const normalizedOrigin = normalizeState(origin);

        if (!groups[normalizedOrigin]) {
            groups[normalizedOrigin] = {
                origin,
                normalizedOrigin,
                totalBags: 0,
                totalWeightKg: 0
            };
        }

        groups[normalizedOrigin].totalBags += quantity;

        groups[normalizedOrigin].totalWeightKg +=
            quantity *
            (
                Number.isFinite(weightPerUnitKg)
                    ? weightPerUnitKg
                    : 0
            );
    }

    const origins = Object.values(groups);

    if (!origins.length) {
        throw new Error(
            "No valid products were found in the cart."
        );
    }

    // --------------------------------------------------
    // CALCULATE EACH ORIGIN → DESTINATION
    // --------------------------------------------------

    let totalTransportFee = 0;

    const transportBreakdown = [];

    for (const group of origins) {
        const {
            origin,
            normalizedOrigin,
            totalBags,
            totalWeightKg
        } = group;

        // --------------------------------------------------
        // SAME STATE
        // --------------------------------------------------
        // Example:
        //
        // Origin:      Niger State
        // Destination: Niger
        //
        // Both normalize to:
        // "niger"
        //
        // Therefore this is intra-state transport.

        if (normalizedOrigin === normalizedDestination) {
            const blocks = Math.ceil(totalBags / 10);

            const fee =
                blocks *
                Number(settings.intraStatePerTenBags);

            totalTransportFee += fee;

            transportBreakdown.push({
                origin,
                destination,
                normalizedOrigin,
                normalizedDestination,
                type: "intra-state",
                bags: totalBags,
                weightKg: totalWeightKg,

                baseRoutePrice: null,
                currentRoutePrice: null,
                truckRatePerTonne: null,

                dieselPrice: Number(
                    settings.currentDieselPrice
                ),

                fuelMultiplier: 1,

                transportFee: fee
            });

            continue;
        }

        // --------------------------------------------------
        // INTERSTATE ROUTE
        // --------------------------------------------------

        // IMPORTANT:
        // Search using normalized states.
        //
        // Example:
        // Niger State -> Lagos State
        //
        // becomes:
        // niger -> lagos

        const route = await Transport.findOne({
            origin: {
                $regex: `^${escapeRegex(normalizedOrigin)}$`,
                $options: "i"
            },

            destination: {
                $regex: `^${escapeRegex(normalizedDestination)}$`,
                $options: "i"
            }
        });

        if (!route) {
            throw new Error(
                `No transport route found from ${origin} to ${destination}.`
            );
        }

        // --------------------------------------------------
        // SMALL INTERSTATE SHIPMENT
        // --------------------------------------------------
        // 1–4 bags use the route's current price.

        if (totalBags <= 4) {
            const fee = Number(route.currentPrice);

            if (!Number.isFinite(fee) || fee < 0) {
                throw new Error(
                    `Invalid transport price for ${origin} to ${destination}.`
                );
            }

            totalTransportFee += fee;

            transportBreakdown.push({
                origin,
                destination,
                normalizedOrigin,
                normalizedDestination,

                type: "interstate-small",

                bags: totalBags,
                weightKg: totalWeightKg,

                baseRoutePrice: Number(
                    route.basePrice
                ),

                currentRoutePrice: Number(
                    route.currentPrice
                ),

                truckRatePerTonne: null,

                dieselPrice: Number(
                    settings.currentDieselPrice
                ),

                fuelMultiplier: 1,

                transportFee: fee
            });

            continue;
        }

        // --------------------------------------------------
        // LARGER INTERSTATE SHIPMENT
        // --------------------------------------------------

        if (
            !Number.isFinite(totalWeightKg) ||
            totalWeightKg <= 0
        ) {
            throw new Error(
                `Weight information is missing for products from ${origin}.`
            );
        }

        // Convert tonne rate to kg rate.
        //
        // Example:
        // ₦46,228 / tonne
        // = ₦46.228 / kg

        const ratePerKg =
            Number(settings.truckRatePerTonne) / 1000;

        const fee = Math.round(
            totalWeightKg *
            ratePerKg *
            fuelMultiplier
        );

        totalTransportFee += fee;

        transportBreakdown.push({
            origin,
            destination,
            normalizedOrigin,
            normalizedDestination,

            type:
                totalWeightKg >= 1000
                    ? "interstate-bulk"
                    : "interstate-weight",

            bags: totalBags,
            weightKg: totalWeightKg,

            baseRoutePrice: Number(
                route.basePrice
            ),

            currentRoutePrice: Number(
                route.currentPrice
            ),

            truckRatePerTonne: Number(
                settings.truckRatePerTonne
            ),

            dieselPrice: Number(
                settings.currentDieselPrice
            ),

            fuelMultiplier,

            transportFee: fee
        });
    }

    // --------------------------------------------------
    // FINAL RESULT
    // --------------------------------------------------

    return {
        transportFee: Math.round(totalTransportFee),

        transportBreakdown,

        dieselPrice: Number(
            settings.currentDieselPrice
        ),

        baseDieselPrice: Number(
            settings.baseDieselPrice
        ),

        truckRatePerTonne: Number(
            settings.truckRatePerTonne
        ),

        fuelSensitivity: Number(
            settings.fuelSensitivity
        ),

        fuelMultiplier
    };
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
    calculateTransport,
    getTransportSettings,
    calculateFuelMultiplier
};