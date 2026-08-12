import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import bookingRoutes from "./routes/bookingRoutes";

// ─── Environment Configuration ───────────────────────────────────────────────
// Load variables from .env file into process.env BEFORE any other code runs.
// If .env doesn't exist, dotenv silently ignores it (useful in production
// where env vars are set by the platform itself, e.g., Railway, Render).
dotenv.config();

// ─── Database Connection ──────────────────────────────────────────────────────
// Connect to MongoDB first. The app won't start serving requests until
// the connection is established (or it will crash with a clear error).
connectDB();

// ─── Express App Initialization ───────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middlewares ───────────────────────────────────────────────────────

// CORS: Allow requests from the frontend development server.
// In production, replace CLIENT_URL with your actual deployed frontend domain.
// 'credentials: true' is needed if you ever want to support cookies.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body Parser: Parse incoming JSON request bodies so we can access req.body
// in our controllers. Express 4.16+ includes this built-in.
app.use(express.json());

// URL-encoded form data parser (for future HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
// Each route file handles a specific domain/resource.
// The prefix (e.g., /api/auth) is set here, not inside the route file.

// Authentication routes: register, login, get current user
app.use("/api/auth", authRoutes);

// Restaurant routes: search, details, availability
app.use("/api/restaurants", restaurantRoutes);

// Booking routes: create, list, cancel
app.use("/api/bookings", bookingRoutes);

// ─── Health Check Route ───────────────────────────────────────────────────────
// A simple endpoint to verify the server is running.
// Useful for uptime monitoring tools and deployment health checks.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "QuickDine API is running! 🍽️",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// This middleware runs when NO route above matched the request.
// It must be defined AFTER all routes.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found. Check the URL and try again.",
  });
});

// ─── Start the Server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  QuickDine backend running on http://localhost:${PORT}`);
  console.log(`📋  Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
