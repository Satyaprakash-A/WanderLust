require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// Use your Atlas database URL from .env, falling back to local only if missing
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB Atlas");

    const initDB = async () => {
        await Listing.deleteMany({});

        initData.data = initData.data.map((obj) => ({
            ...obj,
            owner: "69512270af6871d8ede6a6c4",
            geometry: {
                type: "Point",
                coordinates: [0, 0],
            },
        }));

        await Listing.insertMany(initData.data);
        console.log("Data was successfully initialized in MongoDB Atlas!");
    };

    await initDB();
}

main()
    .catch((err) => {
        console.log("Initialization Error:", err);
    })
    .finally(async () => {
        await mongoose.connection.close();
    });