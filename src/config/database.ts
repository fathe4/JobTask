import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/testschool";

  try {
    await mongoose.connect(mongoUri);

    // Connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB");
    console.error(err);
    throw err;
  }
}
