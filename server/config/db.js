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
                    "========== MONGODB CONNECTION DEBUG =========="
                );

                console.error(
                    "Main error:",
                    error.message
                );

                // Show the actual error for each Atlas server
                if (error.reason && error.reason.servers) {
                    for (const [address, server] of error.reason.servers) {
                        console.error("SERVER:", address);
                        console.error("TYPE:", server.type);
                        console.error(
                            "ERROR:",
                            server.error?.message || "No specific error"
                        );
                    }
                }

                console.error(
                    "================================================"
                );

                cached.promise = null;
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

module.exports = connectDB;