const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGOURL, {
           
        });
        console.log("✅ MongoDB database connected successfully.");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    } catch (error) {
        console.error("Error disconnecting MongoDB:", error.message);
    }
};

module.exports = { connectDB, disconnectDB };