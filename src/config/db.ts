import mongoose from "mongoose";

/**
 * connectDB — Database Connection Helper
 * -----------------------------------------------
 * Flow: This function reads the MONGODB_URI from the
 * environment variables, attempts to connect to MongoDB
 * using Mongoose, and either logs a success message or
 * throws an error that crashes the process (fail-fast
 * behaviour is intentional — the server should NOT run
 * without a database).
 *
 * Called once at application startup in server.ts.
 */
const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Hard-fail: MONGODB_URI is a required environment variable.
    console.error("❌  MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    console.error("❌  MongoDB connection failed:", (error as Error).message);
    process.exit(1); // Exit with failure so Docker/PM2 can restart the service.
  }
};

export default connectDB;
