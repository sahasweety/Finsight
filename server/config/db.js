const mongoose = require("mongoose");
const dns = require("dns");

// Apply DNS workaround ONLY for local development
// Render automatically sets process.env.RENDER = 'true'
if (!process.env.RENDER && process.env.NODE_ENV !== "production") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        };

        cached.promise = mongoose
            .connect(process.env.MONGO_URI, opts)
            .then((mongoose) => {
                console.log(
                    `MongoDB connected: ${mongoose.connection.host}`
                );
                return mongoose;
            })
            .catch((error) => {
                console.error(
                    `MongoDB connection failed: ${error.message}`
                );

                cached.promise = null;
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

module.exports = connectDB;