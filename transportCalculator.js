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
// GET SETTINGS
// --------------------------------------------------

async function getTransportSettings() {

    let settings =
        await TransportSettings.findOne({
            key: "default"
        });

    /*
     * Automatically create the settings document
     * if this is the first time the system runs.
     */
    if (!settings) {

        settings =
            await TransportSettings.create(
                DEFAULT_SETTINGS
            );
    }

    return settings;
}


// --------------------------------------------------
// FUEL MULTIPLIER
// --------------------------------------------------

function calculateFuelMultiplier(settings) {

    const base =
        Number(settings.baseDieselPrice);

    const current =
        Number(settings.currentDieselPrice);

    const sensitivity =
        Number(settings.fuelSensitivity);

    if (
        !Number.isFinite(base) ||
        base <= 0
    ) {
        throw new Error(
            "Invalid base diesel price."
        );
    }

    if (
        !Number.isFinite(current) ||
        current < 0
    ) {
        throw new Error(
            "Invalid current diesel price."
        );
    }

    if (
        !Number.isFinite(sensitivity) ||
        sensitivity < 0 ||
        sensitivity > 1
    ) {
        throw new Error(
            "Invalid fuel sensitivity."
        );
    }

    return (
        1 +
        (
            (current / base) - 1
        ) *
        sensitivity
    );
}


// --------------------------------------------------
// NORMALIZE STATE
// --------------------------------------------------

function normalizeState(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


// --------------------------------------------------
// SAME STATE CHECK
// --------------------------------------------------

function isSameState(origin, destination) {

    return (
        normalizeState(origin) ===
        normalizeState(destination)
    );

}


// --------------------------------------------------
// CALCULATE TRANSPORT
// --------------------------------------------------

async function calculateTransport(
    items,
    destination
) {

    if (
        !Array.isArray(items) ||
        !items.length
    ) {
        throw new Error(
            "Cart is empty."
        );
    }

    if (!destination) {

        throw new Error(
            "Destination state is required."
        );

    }


    const settings =
        await getTransportSettings();


    const fuelMultiplier =
        calculateFuelMultiplier(settings);


    /*
     * Group products by their origin.
     *
     * Example:
     *
     * Niger → Lagos
     * Enugu → Lagos
     *
     * are calculated independently.
     */
    const groups = {};


    for (const item of items) {

        const product =
            item.product;

        if (!product) {
            continue;
        }


        const origin =
            String(
                product.location ||
                product.state ||
                ""
            ).trim();


        if (!origin) {

            throw new Error(
                `Product "${product.productName || "Unknown"}" has no origin state.`
            );

        }


        const quantity =
            Number(item.quantity || 0);


        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            continue;
        }


        const weightPerUnitKg =
            Number(
                product.weightPerUnitKg || 0
            );


        if (!groups[origin]) {

            groups[origin] = {
                origin,
                totalBags: 0,
                totalWeightKg: 0
            };

        }


        groups[origin].totalBags +=
            quantity;

        groups[origin].totalWeightKg +=
            quantity *
            (
                Number.isFinite(
                    weightPerUnitKg
                )
                    ? weightPerUnitKg
                    : 0
            );

    }


    const origins =
        Object.values(groups);


    if (!origins.length) {

        throw new Error(
            "No valid products were found in the cart."
        );

    }


    let totalTransportFee = 0;

    const transportBreakdown = [];


    // --------------------------------------------------
    // CALCULATE EACH ORIGIN
    // --------------------------------------------------

    for (const group of origins) {

        const {
            origin,
            totalBags,
            totalWeightKg
        } = group;


        // ----------------------------------------------
        // SAME STATE
        // ----------------------------------------------

        if (
            isSameState(
                origin,
                destination
            )
        ) {

            const blocks =
                Math.ceil(
                    totalBags / 10
                );


            const fee =
                blocks *
                Number(
                    settings.intraStatePerTenBags
                );


            totalTransportFee += fee;


            transportBreakdown.push({
                origin,
                destination,
                type: "intra-state",
                bags: totalBags,
                weightKg: totalWeightKg,
                baseRoutePrice: null,
                currentRoutePrice: null,
                truckRatePerTonne: null,
                dieselPrice:
                    Number(settings.currentDieselPrice),
                fuelMultiplier: 1,
                transportFee: fee
            });


            continue;

        }


        // ----------------------------------------------
        // INTERSTATE ROUTE
        // ----------------------------------------------

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

            throw new Error(
                `No transport route found from ${origin} to ${destination}.`
            );

        }


        // ----------------------------------------------
        // SMALL ORDER: 4 BAGS OR LESS
        // ----------------------------------------------

        if (totalBags <= 4) {

            const fee =
                Number(
                    route.currentPrice
                );


            totalTransportFee += fee;


            transportBreakdown.push({
                origin,

                destination,

                type: "interstate-small",

                bags: totalBags,

                weightKg: totalWeightKg,

                baseRoutePrice:
                    Number(route.basePrice),

                currentRoutePrice:
                    Number(route.currentPrice),

                truckRatePerTonne: null,

                dieselPrice:
                    Number(settings.currentDieselPrice),

                fuelMultiplier: 1,

                transportFee: fee
            });


            continue;

        }


        // ----------------------------------------------
        // WEIGHT-BASED ORDER
        // ----------------------------------------------

        if (
            !Number.isFinite(totalWeightKg) ||
            totalWeightKg <= 0
        ) {

            throw new Error(
                `Weight information is missing for products from ${origin}.`
            );

        }


        const ratePerKg =
            Number(
                settings.truckRatePerTonne
            ) / 1000;


        const fee =
            Math.round(
                totalWeightKg *
                ratePerKg *
                fuelMultiplier
            );


        totalTransportFee += fee;


        transportBreakdown.push({
            origin,

            destination,

            type:
                totalWeightKg >= 1000
                    ? "interstate-bulk"
                    : "interstate-weight",

            bags: totalBags,

            weightKg: totalWeightKg,

            baseRoutePrice:
                Number(route.basePrice),

            currentRoutePrice:
                Number(route.currentPrice),

            truckRatePerTonne:
                Number(settings.truckRatePerTonne),

            dieselPrice:
                Number(settings.currentDieselPrice),

            fuelMultiplier,

            transportFee: fee
        });

    }


    return {

        transportFee:
            Math.round(
                totalTransportFee
            ),

        transportBreakdown,

        dieselPrice:
            Number(
                settings.currentDieselPrice
            ),

        baseDieselPrice:
            Number(
                settings.baseDieselPrice
            ),

        truckRatePerTonne:
            Number(
                settings.truckRatePerTonne
            ),

        fuelSensitivity:
            Number(
                settings.fuelSensitivity
            ),

        fuelMultiplier

    };

}


// --------------------------------------------------
// REGEX ESCAPER
// --------------------------------------------------

function escapeRegex(value) {

    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


module.exports = {
    calculateTransport,
    getTransportSettings,
    calculateFuelMultiplier
};