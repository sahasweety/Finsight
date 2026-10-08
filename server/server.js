const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();

// Connect to MongoDB
// Handled by middleware below for serverless compatibility

// Middleware
app.use(cors());
app.use(express.json());

// Ensure MongoDB is connected before handling any routes
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error in middleware:', error);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/budgets", budgetRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FinSight API is running"
    });
});

// Export Express app for Vercel
module.exports = app;

