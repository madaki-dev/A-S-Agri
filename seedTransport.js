const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

require("dotenv").config();

const mongoose = require("mongoose");
const Transport = require("./Transport");

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        seedDatabase();
    })
    .catch((err) => {
        console.log(err);
    });

async function seedDatabase() {

    try {

        // Remove old transport prices
        await Transport.deleteMany();

        const transportPrices = [

            { state: "Abia", transportPrice: 6500 },
            { state: "Adamawa", transportPrice: 4000 },
            { state: "Akwa Ibom", transportPrice: 8500 },
            { state: "Anambra", transportPrice: 6500 },
            { state: "Bauchi", transportPrice: 3500 },
            { state: "Bayelsa", transportPrice: 9000 },
            { state: "Benue", transportPrice: 4500 },
            { state: "Borno", transportPrice: 5000 },
            { state: "Cross River", transportPrice: 8500 },
            { state: "Delta", transportPrice: 8000 },
            { state: "Ebonyi", transportPrice: 6500 },
            { state: "Edo", transportPrice: 7000 },
            { state: "Ekiti", transportPrice: 7500 },
            { state: "Enugu", transportPrice: 6500 },
            { state: "FCT", transportPrice: 3000 },
            { state: "Gombe", transportPrice: 3500 },
            { state: "Imo", transportPrice: 7000 },
            { state: "Jigawa", transportPrice: 3000 },
            { state: "Kaduna", transportPrice: 2500 },
            { state: "Kano", transportPrice: 2500 },
            { state: "Katsina", transportPrice: 2500 },
            { state: "Kebbi", transportPrice: 3500 },
            { state: "Kogi", transportPrice: 5000 },
            { state: "Kwara", transportPrice: 5000 },
            { state: "Lagos", transportPrice: 8000 },
            { state: "Nasarawa", transportPrice: 3500 },
            { state: "Niger", transportPrice: 2500 },
            { state: "Ogun", transportPrice: 7500 },
            { state: "Ondo", transportPrice: 7500 },
            { state: "Osun", transportPrice: 7500 },
            { state: "Oyo", transportPrice: 7500 },
            { state: "Plateau", transportPrice: 3500 },
            { state: "Rivers", transportPrice: 9000 },
            { state: "Sokoto", transportPrice: 4000 },
            { state: "Taraba", transportPrice: 4500 },
            { state: "Yobe", transportPrice: 4500 },
            { state: "Zamfara", transportPrice: 3500 }

        ];

        await Transport.insertMany(transportPrices);

        console.log("✅ Transport prices inserted successfully!");

        mongoose.connection.close();

    } catch (error) {

        console.log(error);

        mongoose.connection.close();

    }

}