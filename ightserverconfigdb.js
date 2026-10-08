[1mdiff --git a/server/config/db.js b/server/config/db.js[m
[1mindex c7bb361..3420b7e 100644[m
[1m--- a/server/config/db.js[m
[1m+++ b/server/config/db.js[m
[36m@@ -1,14 +1,33 @@[m
 const mongoose = require("mongoose");[m
 [m
[32m+[m[32mlet cached = global.mongoose;[m
[32m+[m
[32m+[m[32mif (!cached) {[m
[32m+[m[32m    cached = global.mongoose = { conn: null, promise: null };[m
[32m+[m[32m}[m
[32m+[m
 const connectDB = async () => {[m
[31m-    try {[m
[31m-        const conn = await mongoose.connect(process.env.MONGO_URI);[m
[32m+[m[32m    if (cached.conn) {[m
[32m+[m[32m        return cached.conn;[m
[32m+[m[32m    }[m
 [m
[31m-        console.log(`MongoDB connected: ${conn.connection.host}`);[m
[31m-    } catch (error) {[m
[31m-        console.error(`MongoDB connection failed: ${error.message}`);[m
[31m-        process.exit(1);[m
[32m+[m[32m    if (!cached.promise) {[m
[32m+[m[32m        const opts = {[m
[32m+[m[32m            bufferCommands: false,[m
[32m+[m[32m        };[m
[32m+[m
[32m+[m[32m        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {[m
[32m+[m[32m            console.log(`MongoDB connected: ${mongoose.connection.host}`);[m
[32m+[m[32m            return mongoose;[m
[32m+[m[32m        }).catch(error => {[m
[32m+[m[32m            console.error(`MongoDB connection failed: ${error.message}`);[m
[32m+[m[32m            cached.promise = null;[m
[32m+[m[32m            throw error;[m
[32m+[m[32m        });[m
     }[m
[32m+[m
[32m+[m[32m    cached.conn = await cached.promise;[m
[32m+[m[32m    return cached.conn;[m
 };[m
 [m
 module.exports = connectDB;[m
\ No newline at end of file[m
[1mdiff --git a/server/server.js b/server/server.js[m
[1mindex 222c724..7d3ba34 100644[m
[1m--- a/server/server.js[m
[1m+++ b/server/server.js[m
[36m@@ -11,12 +11,23 @@[m [mconst budgetRoutes = require("./routes/budgetRoutes");[m
 const app = express();[m
 [m
 // Connect to MongoDB[m
[31m-connectDB();[m
[32m+[m[32m// Handled by middleware below for serverless compatibility[m
 [m
 // Middleware[m
 app.use(cors());[m
 app.use(express.json());[m
 [m
[32m+[m[32m// Ensure MongoDB is connected before handling any routes[m
[32m+[m[32mapp.use(async (req, res, next) => {[m
[32m+[m[32m    try {[m
[32m+[m[32m        await connectDB();[m
[32m+[m[32m        next();[m
[32m+[m[32m    } catch (error) {[m
[32m+[m[32m        console.error('Database connection error in middleware:', error);[m
[32m+[m[32m        res.status(500).json({ success: false, message: 'Database connection failed' });[m
[32m+[m[32m    }[m
[32m+[m[32m});[m
[32m+[m
 // API Routes[m
 app.use("/api/users", userRoutes);[m
 app.use("/api/transactions", transactionRoutes);[m
