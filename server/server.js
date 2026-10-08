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
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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

